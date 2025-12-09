// 主入口文件

import { initUI } from './ui.js';
import { initProfitCalculator } from './profitCalculator.js';
import { initLiquidationCalculator } from './liquidationCalculator.js';
import { initPositionCalculator } from './positionCalculator.js';
import { initAveragePriceCalculator } from './averagePriceCalculator.js';
import { initThemeManager } from './themeManager.js';
import * as config from './config.js';

/**
 * 应用初始化
 */
function initApp() {
    console.log('Initializing Contract Calculator...');
    
    try {
        // 初始化主题管理器（优先初始化，避免闪烁）
        initThemeManager();
        
        // 初始化全局配置
        console.log('Config:', config.getAllConfig());
        
        // 初始化UI组件
        initUI();
        
        // 初始化四个计算器模块
        initProfitCalculator();
        initLiquidationCalculator();
        initPositionCalculator();
        initAveragePriceCalculator();
        
        console.log('Contract Calculator initialized successfully! 🎉');
        
        // 显示欢迎信息
        showWelcomeMessage();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showErrorMessage('应用初始化失败，请刷新页面重试');
    }
}

/**
 * 显示欢迎信息
 */
function showWelcomeMessage() {
    console.log('%c欢迎使用合约计算器！', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    console.log('%c功能说明：', 'color: #10b981; font-weight: bold;');
    console.log('1. 收益额计算 - 计算持仓的实际收益和收益率');
    console.log('2. 强平价格计算 - 评估风险，计算强制平仓价格');
    console.log('3. 仓位计算 - 根据风险承受能力计算合理开仓数量');
    console.log('4. 开仓均价计算 - 多次开仓的加权平均成本');
    console.log('%c提示：切换交易方向和调整手续费率会自动更新所有计算结果', 'color: #f59e0b; font-style: italic;');
}

/**
 * 显示错误信息
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * 监听配置变更
 */
function setupConfigListeners() {
    config.addConfigListener((key, value) => {
        console.log(`Config changed: ${key} =`, value);
        
        // 可以在这里添加全局的配置变更处理逻辑
        if (key === 'direction') {
            const directionText = value === config.Direction.LONG ? '做多 📈' : '做空 📉';
            console.log(`交易方向已切换为: ${directionText}`);
        }
    });
}

/**
 * 页面加载完成后初始化
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        setupConfigListeners();
    });
} else {
    initApp();
    setupConfigListeners();
}

// 导出供外部使用
export { initApp };