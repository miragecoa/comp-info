/**
 * 里昂生态环保投资 - 主JavaScript文件
 * 功能：从Strapi CMS API获取所有数据并渲染到页面
 * 所有内容都来自CMS，没有默认数据
 */

// API配置
const API_BASE_URL = 'http://localhost:1337/api';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 初始化滚动效果
    initScrollEffects();

    // 从API加载所有数据
    Promise.all([
        loadCompanyData(),
        loadFoundersData()
    ]).then(() => {
        // 数据加载完成后隐藏加载动画
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 500);
    }).catch(error => {
        console.error('加载数据出错:', error);
        // 仍然隐藏加载动画
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    });
});

/**
 * 初始化滚动效果
 */
function initScrollEffects() {
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * 从API加载公司数据
 */
async function loadCompanyData() {
    try {
        const response = await fetch(`${API_BASE_URL}/company`);
        if (!response.ok) {
            throw new Error(`API响应错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('公司数据:', data);

        if (data && data.data) {
            const company = data.data;
            renderCompanyData(company);
        } else {
            displayError('company', '未找到公司数据，请在CMS中添加');
        }
    } catch (error) {
        console.error('加载公司数据失败:', error.message);
        displayError('company', '无法加载公司数据: ' + error.message);
    }
}

/**
 * 从API加载创始人数据
 */
async function loadFoundersData() {
    try {
        const response = await fetch(`${API_BASE_URL}/founders?sort=order:asc&populate=avatar`);
        if (!response.ok) {
            throw new Error(`API响应错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('创始人数据:', data);

        if (data && data.data && data.data.length > 0) {
            renderFoundersData(data.data);
        } else {
            displayError('founders', '未找到创始人数据，请在CMS中添加');
        }
    } catch (error) {
        console.error('加载创始人数据失败:', error.message);
        displayError('founders', '无法加载创始人数据: ' + error.message);
    }
}

/**
 * 渲染公司数据到页面
 */
function renderCompanyData(company) {
    // 更新头部Logo文字
    const headerLogo = document.getElementById('header-logo-text');
    if (headerLogo && company.name) {
        headerLogo.textContent = company.name;
    }

    // 更新公司名称
    const companyName = document.getElementById('company-name');
    if (companyName) {
        companyName.textContent = company.name || '未设置公司名称';
    }

    // 更新口号
    const slogan = document.getElementById('company-slogan');
    if (slogan) {
        slogan.textContent = company.slogan || '未设置口号';
    }

    // 更新成立时间
    const foundedDate = document.getElementById('founded-date');
    if (foundedDate && company.foundedDate) {
        const date = new Date(company.foundedDate);
        foundedDate.textContent = date.getFullYear() + '年';
    } else if (foundedDate) {
        foundedDate.textContent = '未设置';
    }

    // 更新注册资本
    const capital = document.getElementById('capital');
    if (capital) {
        capital.textContent = company.registeredCapital || '未设置';
    }

    // 更新公司描述
    const descContainer = document.getElementById('company-description');
    if (descContainer) {
        if (company.description) {
            descContainer.innerHTML = company.description;
        } else {
            descContainer.innerHTML = '<p class="error-text">未设置公司描述</p>';
        }
    }

    // 渲染业务高亮区域
    renderBusinessHighlights(company.mainBusiness);

    // 更新页脚
    const footerName = document.getElementById('footer-company-name');
    if (footerName && company.name) {
        footerName.textContent = company.name;
    }

    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright && company.name) {
        const year = new Date().getFullYear();
        footerCopyright.textContent = `© ${year} ${company.name}. All Rights Reserved.`;
    }
}

/**
 * 渲染业务高亮区域
 */
function renderBusinessHighlights(mainBusiness) {
    const highlightsContainer = document.getElementById('about-highlights');
    const businessContainer = document.getElementById('main-business');

    // 默认业务列表
    const defaultBusinesses = [
        { icon: '⚡', title: '生物质发电', desc: '请在CMS中设置业务描述' },
        { icon: '🔥', title: '热力供应', desc: '请在CMS中设置业务描述' },
        { icon: '♻️', title: '环保投资', desc: '请在CMS中设置业务描述' }
    ];

    // 尝试从mainBusiness解析业务信息
    let businesses = defaultBusinesses;
    if (mainBusiness) {
        // 如果mainBusiness是逗号分隔的字符串，拆分并创建业务卡片
        const parts = mainBusiness.split('、');
        if (parts.length > 0) {
            const icons = ['🌾', '⚡', '🏭', '♻️', '🔥'];
            businesses = parts.map((part, index) => ({
                icon: icons[index % icons.length],
                title: part.trim(),
                desc: '点击查看详情'
            }));
        }
    }

    // 渲染高亮区域
    if (highlightsContainer) {
        highlightsContainer.innerHTML = businesses.slice(0, 3).map(biz => `
            <div class="highlight-item">
                <div class="highlight-icon">${biz.icon}</div>
                <h3>${biz.title}</h3>
                <p>${biz.desc}</p>
            </div>
        `).join('');
    }

    // 渲染业务卡片
    if (businessContainer) {
        businessContainer.innerHTML = businesses.map(biz => `
            <div class="business-card">
                <div class="business-icon">${biz.icon}</div>
                <h3>${biz.title}</h3>
                <p>${biz.desc}</p>
            </div>
        `).join('');
    }
}

/**
 * 渲染创始人数据到页面
 */
function renderFoundersData(founders) {
    const container = document.getElementById('founders-container');
    if (!container) return;

    container.innerHTML = founders.map(founder => {
        // Strapi v5 数据结构
        const data = founder;
        const avatarUrl = data.avatar?.url
            ? API_BASE_URL.replace('/api', '') + data.avatar.url
            : null;

        return `
            <div class="founder-card">
                <div class="founder-avatar">
                    ${avatarUrl
                ? `<img src="${avatarUrl}" alt="${data.name}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;">`
                : `<div class="avatar-placeholder">${data.name ? data.name.charAt(0) : '?'}</div>`
            }
                </div>
                <div class="founder-info">
                    <h3 class="founder-name">${data.name || '未设置姓名'}</h3>
                    <p class="founder-position">${data.position || '未设置职位'}</p>
                    <div class="founder-details">
                        ${data.education ? `<p><strong>教育背景：</strong>${data.education}</p>` : ''}
                        ${data.shareholding ? `<p><strong>持股比例：</strong>${data.shareholding}</p>` : ''}
                    </div>
                    ${data.biography ? `<p class="founder-bio">${data.biography}</p>` : '<p class="founder-bio">未设置个人简介</p>'}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 显示错误信息
 */
function displayError(section, message) {
    const errorHTML = `<p class="error-text" style="color: #ff6b6b; padding: 20px; background: rgba(255,107,107,0.1); border-radius: 8px; text-align: center;">${message}</p>`;

    switch (section) {
        case 'company':
            const companyName = document.getElementById('company-name');
            if (companyName) companyName.textContent = '数据加载失败';

            const descContainer = document.getElementById('company-description');
            if (descContainer) descContainer.innerHTML = errorHTML;
            break;

        case 'founders':
            const foundersContainer = document.getElementById('founders-container');
            if (foundersContainer) foundersContainer.innerHTML = errorHTML;
            break;
    }
}

// 打印欢迎信息
console.log('%c里昂生态环保投资', 'color: #1a5f3c; font-size: 24px; font-weight: bold;');
console.log('%c所有内容从Strapi CMS加载', 'color: #c8a45a; font-size: 14px;');
console.log('%cAPI地址: ' + API_BASE_URL, 'color: #666; font-size: 12px;');
