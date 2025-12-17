const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const dbPromise = require('./database');

const app = express();
const PORT = 1337;
const JWT_SECRET = 'your-secret-key-change-it';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// File Upload Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Ensure dir exists (simple logic for now, usually initDB or startup creates it)
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper to format response like Strapi (optional but helps frontend migration)
const formatResponse = (data) => ({ data });
const formatError = (msg) => ({ error: { message: msg } });

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json(formatError('Unauthorized'));

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json(formatError('Forbidden'));
        req.user = user;
        next();
    });
};

// --- ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await dbPromise;

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json(formatError('User not found'));

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json(formatError('Invalid password'));

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    // Strapi response format for login
    res.json({ jwt: token, user: { id: user.id, username: user.username } });
});

// Company - GET
app.get('/api/company', async (req, res) => {
    const db = await dbPromise;
    const company = await db.get('SELECT * FROM company WHERE id = 1');
    if (company) {
        // Parse main_business if string
        try {
            if (typeof company.main_business === 'string') {
                const parsed = JSON.parse(company.main_business);
                // Strapi v5 might return it formatted differently, but main.js expects an array if possible or handles string?
                // main.js: const parts = mainBusiness.split('、'); IF mainBusiness is string.
                // Let's return the string representation for simplicity with frontend code that splits by '、'
                // OR better: return the text stored in DB if it helps.
                // Actually DB init stored JSON string.
                // Frontend code: parts = mainBusiness.split('、'); 
                // So mainBusiness SHOULD be a string like "A、B、C".
                // My initDB stored JSON array. I should fix that return or fix frontend.
                // Let's convert JSON array to "、" joined string for frontend compatibility
                company.mainBusiness = parsed.join('、');
            }
        } catch (e) { }

        // CamelCase for frontend
        const responseData = {
            id: company.id,
            name: company.name,
            slogan: company.slogan,
            description: company.description,
            foundedDate: company.founded_date,
            registeredCapital: company.registered_capital,
            mainBusiness: company.mainBusiness || company.main_business,
            address: company.address,
            phone: company.phone,
            email: company.email
        };
        res.json(formatResponse(responseData));
    } else {
        res.status(404).json(formatError('Not found'));
    }
});

// Company - PUT
app.put('/api/company', authenticateToken, async (req, res) => {
    const { name, slogan, description, foundedDate, registeredCapital, mainBusiness, address, phone, email } = req.body;
    const db = await dbPromise;

    // Expect mainBusiness to be array or string? DB stores JSON string array usually for flexibility, 
    // but let's store what we get.
    // If frontend sends comma separated, we store that or array?
    // Let's assume we store array.
    let mainBizVal = mainBusiness;
    if (Array.isArray(mainBusiness)) {
        mainBizVal = JSON.stringify(mainBusiness);
    }

    await db.run(
        `UPDATE company SET name=?, slogan=?, description=?, founded_date=?, registered_capital=?, main_business=?, address=?, phone=?, email=? WHERE id=1`,
        [name, slogan, description, foundedDate, registeredCapital, mainBizVal, address, phone, email]
    );

    res.json(formatResponse({ success: true }));
});

// Founders - GET
app.get('/api/founders', async (req, res) => {
    const db = await dbPromise;
    const founders = await db.all('SELECT * FROM founders ORDER BY order_index ASC');

    const formatted = founders.map(f => ({
        id: f.id,
        name: f.name,
        position: f.position,
        biography: f.bio,
        education: f.education,
        shareholding: f.shareholding,
        avatar: f.avatar_url ? { url: f.avatar_url } : null // Strapi structure for image
    }));

    res.json(formatResponse(formatted));
});

// Founders - POST
app.post('/api/founders', authenticateToken, async (req, res) => {
    const { name, position, biography, education, shareholding, avatarUrl, orderIndex } = req.body;
    const db = await dbPromise;

    const result = await db.run(
        `INSERT INTO founders (name, position, bio, education, shareholding, avatar_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, position, biography, education, shareholding, avatarUrl, orderIndex || 0]
    );

    res.json(formatResponse({ id: result.lastID }));
});

// Founders - PUT
app.put('/api/founders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, position, biography, education, shareholding, avatarUrl, orderIndex } = req.body;
    const db = await dbPromise;

    await db.run(
        `UPDATE founders SET name=?, position=?, bio=?, education=?, shareholding=?, avatar_url=?, order_index=? WHERE id=?`,
        [name, position, biography, education, shareholding, avatarUrl, orderIndex, id]
    );

    res.json(formatResponse({ success: true }));
});

// Founders - DELETE
app.delete('/api/founders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const db = await dbPromise;
    await db.run('DELETE FROM founders WHERE id = ?', [id]);
    res.json(formatResponse({ success: true }));
});

// Upload
app.post('/api/upload', authenticateToken, upload.single('files'), (req, res) => {
    if (!req.file) return res.status(400).json(formatError('No file uploaded'));

    // Return Strapi-like structure: array of objects
    res.json([{
        id: Date.now(),
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}` // Relative URL
    }]);
});

// Create uploads dir if not exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
    fs.mkdirSync(path.join(__dirname, '../uploads'));
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Custom CMS Backend running on port ${PORT}`);
});
