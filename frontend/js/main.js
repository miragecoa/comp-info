/**
 * 湖南理昂环保能源投资有限公司 - Main Script
 */

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:1337/api'
    : '/api';

document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initActiveNav();
    initMobileNav();
    initSmoothScroll();
    initRevealAnimations();

    Promise.all([
        loadCompanyData(),
        loadFoundersData()
    ]).then(() => {
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
        }, 300);
    }).catch(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    });
});

/* --- Header scroll effect --- */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const check = () => header.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', check, { passive: true });
    check();
}

/* --- Active nav link based on scroll position --- */
function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-40% 0px -60% 0px' });

    sections.forEach(s => observer.observe(s));
}

/* --- Mobile navigation toggle --- */
function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('open');
    });

    // Close on link click
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            nav.classList.remove('open');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            toggle.classList.remove('active');
            nav.classList.remove('open');
        }
    });
}

/* --- Smooth scroll for anchor links --- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 90;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* --- Scroll reveal animations --- */
function initRevealAnimations() {
    const reveals = document.querySelectorAll('.reveal:not(.visible)');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    reveals.forEach(el => observer.observe(el));
}

/* --- Load company data --- */
async function loadCompanyData() {
    try {
        const res = await fetch(`${API_BASE_URL}/company`);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        if (json?.data) renderCompanyData(json.data);
        else showError('company', '未找到公司数据');
    } catch (err) {
        console.error('Company data error:', err);
        showError('company', '无法加载公司数据');
    }
}

/* --- Load founders data --- */
async function loadFoundersData() {
    try {
        const res = await fetch(`${API_BASE_URL}/founders?sort=order:asc&populate=avatar`);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        if (json?.data?.length) renderFoundersData(json.data);
        else showError('founders', '未找到创始人数据');
    } catch (err) {
        console.error('Founders data error:', err);
        showError('founders', '无法加载创始人数据');
    }
}

/* --- Render company data --- */
function renderCompanyData(company) {
    setText('header-logo-text', company.name);
    setText('company-name', company.name);
    setText('company-slogan', company.slogan);
    setText('footer-company-name', company.name);

    const dateEl = document.getElementById('founded-date');
    if (dateEl && company.foundedDate) {
        dateEl.textContent = new Date(company.foundedDate).getFullYear() + '年';
    }

    setText('capital', company.registeredCapital);

    const descEl = document.getElementById('company-description');
    if (descEl && company.description) descEl.innerHTML = company.description;

    const copyEl = document.getElementById('footer-copyright');
    if (copyEl && company.name) {
        copyEl.innerHTML = `&copy; ${new Date().getFullYear()} ${company.name}. All Rights Reserved.`;
    }

    renderBusiness(company.mainBusiness);
}

/* --- Render business --- */
function renderBusiness(mainBusiness) {
    let items = [];
    if (typeof mainBusiness === 'string') {
        items = mainBusiness.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(mainBusiness)) {
        items = mainBusiness;
    }
    if (!items.length) return;

    const highlightsEl = document.getElementById('about-highlights');
    if (highlightsEl) {
        highlightsEl.innerHTML = items.map(item => `
            <div class="highlight-item reveal">
                <h3>${item}</h3>
                <p>点击查看详情</p>
            </div>
        `).join('');
    }

    const businessEl = document.getElementById('main-business');
    if (businessEl) {
        businessEl.innerHTML = items.map((item, i) => `
            <div class="business-card reveal">
                <div class="business-number">${String(i + 1).padStart(2, '0')}</div>
                <h3>${item}</h3>
                <p>点击查看详情</p>
            </div>
        `).join('');
    }

    initRevealAnimations();
}

/* --- Render founders (horizontal cards) --- */
function renderFoundersData(founders) {
    const container = document.getElementById('founders-container');
    if (!container) return;

    container.innerHTML = founders.map(f => {
        const avatarUrl = f.avatar?.url
            ? API_BASE_URL.replace('/api', '') + f.avatar.url
            : null;

        return `
            <div class="founder-card reveal">
                <div class="founder-avatar">
                    ${avatarUrl
                        ? `<img class="avatar-img" src="${avatarUrl}" alt="${f.name}">`
                        : `<div class="avatar-circle">${f.name ? f.name.charAt(0) : '?'}</div>`
                    }
                </div>
                <div class="founder-body">
                    <div class="founder-header">
                        <h3 class="founder-name">${f.name || ''}</h3>
                        <span class="founder-position">${f.position || ''}</span>
                    </div>
                    ${f.education ? `<span class="founder-edu">${f.education}</span>` : ''}
                    <p class="founder-bio">${f.biography || ''}</p>
                </div>
            </div>
        `;
    }).join('');

    initRevealAnimations();
}

/* --- Utilities --- */
function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
}

function showError(section, msg) {
    const html = `<p class="error-text">${msg}</p>`;
    const targets = {
        company: 'company-description',
        founders: 'founders-container'
    };
    const el = document.getElementById(targets[section]);
    if (el) el.innerHTML = html;
}
