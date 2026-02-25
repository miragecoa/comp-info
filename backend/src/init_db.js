const dbPromise = require('./database');
const bcrypt = require('bcryptjs');

async function initDB() {
    const db = await dbPromise;

    // 1. Create Tables
    await db.exec(`
    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY,
      name TEXT,
      slogan TEXT,
      description TEXT,
      founded_date TEXT,
      registered_capital TEXT,
      main_business TEXT,
      address TEXT,
      phone TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS founders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      position TEXT,
      bio TEXT,
      education TEXT,
      shareholding TEXT,
      avatar_url TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

    console.log('Tables created.');

    // 2. Seed Company Data
    const company = await db.get('SELECT * FROM company WHERE id = 1');
    if (!company) {
        const mainBusiness = JSON.stringify(['农林废弃物发电', '生物质能发电', '热力生产供应']);
        const desc = `<p>理昂生态能源股份有限公司（曾用名：理昂新能源股份有限公司），成立于2014年12月12日，前身可追溯至2008年。注册资本1.82亿元人民币。</p><p>公司主要从事农林废弃物发电、生物质能发电、热力生产供应，是国内农林生物质发电行业骨干企业。</p>`;

        await db.run(
            `INSERT INTO company (id, name, slogan, description, founded_date, registered_capital, main_business) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [1, '湖南理昂环保能源投资有限公司', '国内农林生物质发电行业骨干企业', desc, '2014-12-12', '1.82亿元', mainBusiness]
        );
        console.log('Company data seeded.');
    }

    // 3. Seed Founders Data
    const founderCount = await db.get('SELECT count(*) as count FROM founders');
    if (founderCount.count === 0) {
        // 郭振军
        const bioGuo = `湖南津市人，武汉大学本科，中山大学企业管理硕士、博士。曾任职广日集团多年，2008年联合创立理昂生态前身企业，投身生物质能源领域。理昂生态董事长兼总经理、法定代表人，直接持股约23.57%。`;
        await db.run(
            `INSERT INTO founders (name, position, bio, education, shareholding, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
            ['郭振军', '董事兼总经理', bioGuo, '武汉大学本科，中山大学博士', '约23.57%', 1]
        );

        // 王焕庆
        const bioWang = `理昂生态能源股份有限公司董事，同时是湖南理昂环保能源投资有限公司法定代表人、执行董事。深度参与生物质发电、环保能源投资等业务，长期与郭振军等合作。`;
        await db.run(
            `INSERT INTO founders (name, position, bio, education, order_index) VALUES (?, ?, ?, ?, ?)`,
            ['王焕庆', '董事长', bioWang, '复旦大学毕业', 2]
        );

        // 宋延军
        const bioSong = `1994年，参与创办中国第一批合伙制律师事务所：共和律师事务所，并担任共和律师事务所深圳分所创始人。2010年，宋延军举家赴美，开始美国投资生涯，早期偏重于纳斯达克上市公司的投资、拉斯维加斯房地产项目以及圣地亚哥房地产项目的开发投资。后期，陆续进入人工智能产业、高尔夫产业以及生物医药领域，逐步形成横跨科技、地产、体育与生命科学的多元化国际投资版图，在国际投资界持续保持较高的活跃度与影响力。标志性项目：深度参与并主导多个企业重组项目，包括粤海集团重组、中旅集团重组等标志性项目，项目重组金额均近600亿港币。`;
        await db.run(
            `INSERT INTO founders (name, position, bio, education, order_index) VALUES (?, ?, ?, ?, ?)`,
            ['宋延军', '跨境投资与并购专家', bioSong, '吉林大学法学院毕业', 3]
        );

        console.log('Founders data seeded.');
    }

    // 4. Seed Admin User
    const userCount = await db.get('SELECT count(*) as count FROM users');
    if (userCount.count > 0) {
        const hashedPassword = await bcrypt.hash('Rickywang2016', 10);
        const existing = await db.get('SELECT * FROM users WHERE username = ?', ['3238384285@qq.com']);

        if (!existing) {
            await db.run('DELETE FROM users WHERE username = "admin"');
            await db.run(
                `INSERT INTO users (username, password) VALUES (?, ?)`,
                ['3238384285@qq.com', hashedPassword]
            );
            console.log('Admin user updated to 3238384285@qq.com');
        } else {
            await db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, '3238384285@qq.com']);
            console.log('Admin password updated.');
        }
    } else {
        const hashedPassword = await bcrypt.hash('Rickywang2016', 10);
        await db.run(
            `INSERT INTO users (username, password) VALUES (?, ?)`,
            ['3238384285@qq.com', hashedPassword]
        );
        console.log('Admin user seeded (3238384285@qq.com).');
    }

    console.log('Database initialization complete.');
}

initDB().catch(err => {
    console.error('Init DB failed:', err);
});
