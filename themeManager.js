// 主题管理模块

const THEME_KEY = 'contract-calculator-theme';
const DARK_MODE_CLASS = 'dark-mode';

/**
 * 获取当前主题
 * @returns {string} 'light' 或 'dark'
 */
export function getCurrentTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
}

/**
 * 设置主题
 * @param {string} theme - 'light' 或 'dark'
 */
export function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

/**
 * 应用主题到页面
 * @param {string} theme - 'light' 或 'dark'
 */
function applyTheme(theme) {
    const body = document.body;
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (theme === 'dark') {
        body.classList.add(DARK_MODE_CLASS);
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
    } else {
        body.classList.remove(DARK_MODE_CLASS);
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    }
    
    // 触发方向按钮样式更新
    updateDirectionButtonsForTheme();
}

/**
 * 更新方向按钮样式以适应当前主题
 */
function updateDirectionButtonsForTheme() {
    // 触发一个自定义事件，让UI模块更新按钮样式
    const event = new CustomEvent('themeChanged');
    window.dispatchEvent(event);
}

/**
 * 切换主题
 */
export function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // 添加切换动画
    const body = document.body;
    body.style.transition = 'background 0.5s ease, color 0.5s ease';
    setTimeout(() => {
        body.style.transition = '';
    }, 500);
}

/**
 * 判断是否为黑夜模式
 * @returns {boolean}
 */
export function isDarkMode() {
    return getCurrentTheme() === 'dark';
}

/**
 * 初始化主题管理器
 */
export function initThemeManager() {
    // 应用保存的主题
    const savedTheme = getCurrentTheme();
    applyTheme(savedTheme);
    
    // 绑定切换按钮事件
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            toggleTheme();
            
            // 添加点击动画
            toggleBtn.style.transform = 'scale(0.9) rotate(180deg)';
            setTimeout(() => {
                toggleBtn.style.transform = '';
            }, 300);
        });
    }
    
    // 监听系统主题变化（可选）
    if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            // 如果用户没有手动设置过主题，则跟随系统
            if (!localStorage.getItem(THEME_KEY)) {
                const systemTheme = e.matches ? 'dark' : 'light';
                applyTheme(systemTheme);
            }
        });
    }
    
    console.log('Theme manager initialized. Current theme:', savedTheme);
}

export default {
    getCurrentTheme,
    setTheme,
    toggleTheme,
    isDarkMode,
    initThemeManager
};