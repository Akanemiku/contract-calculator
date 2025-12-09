// UI组件和交互逻辑模块

import * as config from './config.js';
import * as validator from './validator.js';

/**
 * 初始化交易方向切换
 */
function initDirectionToggle() {
    const longBtn = document.getElementById('directionLong');
    const shortBtn = document.getElementById('directionShort');
    
    if (!longBtn || !shortBtn) return;
    
    // 切换到做多
    longBtn.addEventListener('click', () => {
        config.setDirection(config.Direction.LONG);
        updateDirectionUI();
    });
    
    // 切换到做空
    shortBtn.addEventListener('click', () => {
        config.setDirection(config.Direction.SHORT);
        updateDirectionUI();
    });
}

/**
 * 更新交易方向UI
 */
function updateDirectionUI() {
    const longBtn = document.getElementById('directionLong');
    const shortBtn = document.getElementById('directionShort');
    
    if (!longBtn || !shortBtn) return;
    
    if (config.isLong()) {
        // 做多样式
        longBtn.className = 'px-8 py-3 rounded-full font-medium text-sm transition-all bg-green-500 text-white shadow-lg';
        shortBtn.className = 'px-8 py-3 rounded-full font-medium text-sm transition-all bg-white text-gray-700 border border-gray-200';
    } else {
        // 做空样式
        longBtn.className = 'px-8 py-3 rounded-full font-medium text-sm transition-all bg-white text-gray-700 border border-gray-200';
        shortBtn.className = 'px-8 py-3 rounded-full font-medium text-sm transition-all bg-red-500 text-white shadow-lg';
    }
}

/**
 * 初始化手续费率配置
 */
function initFeeRateConfig() {
    const makerInput = document.getElementById('makerFee');
    const takerInput = document.getElementById('takerFee');
    const makerWarning = document.getElementById('makerFeeWarning');
    const takerWarning = document.getElementById('takerFeeWarning');
    
    if (!makerInput || !takerInput) return;
    
    // Maker手续费率变更
    makerInput.addEventListener('input', () => {
        const rate = parseFloat(makerInput.value);
        
        if (validator.isValidNumber(rate)) {
            config.setMakerFeeRate(rate);
            
            // 检查是否过高
            if (config.isFeeRateTooHigh(rate / 100)) {
                makerWarning.classList.remove('hidden');
            } else {
                makerWarning.classList.add('hidden');
            }
        }
    });
    
    // Taker手续费率变更
    takerInput.addEventListener('input', () => {
        const rate = parseFloat(takerInput.value);
        
        if (validator.isValidNumber(rate)) {
            config.setTakerFeeRate(rate);
            
            // 检查是否过高
            if (config.isFeeRateTooHigh(rate / 100)) {
                takerWarning.classList.remove('hidden');
            } else {
                takerWarning.classList.add('hidden');
            }
        }
    });
    
    // 限制输入范围
    [makerInput, takerInput].forEach(input => {
        input.addEventListener('blur', () => {
            let value = parseFloat(input.value);
            if (isNaN(value) || value < 0) {
                value = 0;
            }
            if (value > 100) {
                value = 100;
            }
            input.value = value.toFixed(4);
        });
    });
}

/**
 * 初始化输入框验证
 */
function initInputValidation() {
    // 获取所有数字输入框
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        // 移除所有键盘输入限制，让浏览器原生处理
        // type="number" 的输入框会自动处理数字和小数点输入
        
        // 失焦时格式化
        input.addEventListener('blur', () => {
            if (input.value && validator.isValidNumber(input.value)) {
                const value = parseFloat(input.value);
                const step = parseFloat(input.step) || 1;
                const decimals = step < 1 ? step.toString().split('.')[1]?.length || 4 : 0;
                input.value = value.toFixed(decimals);
            }
        });
        
        // 输入时进行基本验证（但不阻止输入）
        input.addEventListener('input', () => {
            // 移除非法字符（除了数字、小数点、负号）
            let value = input.value;
            // 只保留数字、小数点和负号
            value = value.replace(/[^\d.-]/g, '');
            // 确保只有一个小数点
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            // 确保负号只在开头
            if (value.indexOf('-') > 0) {
                value = value.replace(/-/g, '');
            }
            if (input.value !== value) {
                input.value = value;
            }
        });
    });
}

/**
 * 添加页面加载动画
 */
function initPageAnimations() {
    // 为所有卡片添加渐入动画
    const cards = document.querySelectorAll('.fade-in');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

/**
 * 初始化响应式布局调整
 */
function initResponsiveLayout() {
    // 监听窗口大小变化
    const handleResize = () => {
        const width = window.innerWidth;
        
        // 在小屏幕上调整布局
        if (width < 768) {
            // 移动端优化
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始调用
}

/**
 * 初始化所有UI组件
 */
export function initUI() {
    initDirectionToggle();
    initFeeRateConfig();
    initInputValidation();
    initPageAnimations();
    initResponsiveLayout();
    
    // 初始化UI状态
    updateDirectionUI();
    
    console.log('UI initialized successfully');
}

export default {
    initUI
};