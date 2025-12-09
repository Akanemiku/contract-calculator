// 强平价格计算模块

import * as validator from './validator.js';
import * as config from './config.js';

/**
 * 计算做多强平价格
 * @param {number} leverage - 杠杆倍数
 * @param {number} openPrice - 开仓价格
 * @param {number} quantity - 持仓数量
 * @param {number} addMargin - 增加的保证金
 * @param {number} customInitialMargin - 自定义初始保证金（可选）
 * @returns {Object}
 */
function calculateLongLiquidationPrice(leverage, openPrice, quantity, addMargin, customInitialMargin = null) {
    // 初始保证金：如果用户输入了自定义值则使用，否则根据杠杆计算
    let initialMargin;
    if (customInitialMargin !== null && customInitialMargin > 0) {
        initialMargin = customInitialMargin;
    } else {
        // 初始保证金 = 持仓价值 / 杠杆倍数
        const positionValue = quantity * openPrice;
        initialMargin = positionValue / leverage;
    }
    
    // 总保证金 = 初始保证金 + 增加保证金
    const totalMargin = initialMargin + addMargin;
    
    // 做多强平价格 = 开仓价格 - (总保证金 / 数量)
    // 当价格跌到这个点时，亏损额 = 总保证金，触发强平
    const liquidationPrice = openPrice - (totalMargin / quantity);
    
    return {
        liquidationPrice: liquidationPrice,
        initialMargin: initialMargin,
        totalMargin: totalMargin
    };
}

/**
 * 计算做空强平价格
 * @param {number} leverage - 杠杆倍数
 * @param {number} openPrice - 开仓价格
 * @param {number} quantity - 持仓数量
 * @param {number} addMargin - 增加的保证金
 * @param {number} customInitialMargin - 自定义初始保证金（可选）
 * @returns {Object}
 */
function calculateShortLiquidationPrice(leverage, openPrice, quantity, addMargin, customInitialMargin = null) {
    // 初始保证金：如果用户输入了自定义值则使用，否则根据杠杆计算
    let initialMargin;
    if (customInitialMargin !== null && customInitialMargin > 0) {
        initialMargin = customInitialMargin;
    } else {
        // 初始保证金 = 持仓价值 / 杠杆倍数
        const positionValue = quantity * openPrice;
        initialMargin = positionValue / leverage;
    }
    
    // 总保证金 = 初始保证金 + 增加保证金
    const totalMargin = initialMargin + addMargin;
    
    // 做空强平价格 = 开仓价格 + (总保证金 / 数量)
    // 当价格涨到这个点时，亏损额 = 总保证金，触发强平
    const liquidationPrice = openPrice + (totalMargin / quantity);
    
    return {
        liquidationPrice: liquidationPrice,
        initialMargin: initialMargin,
        totalMargin: totalMargin
    };
}

/**
 * 计算强平价格（根据当前交易方向）
 * @param {number} leverage - 杠杆倍数
 * @param {number} openPrice - 开仓价格
 * @param {number} quantity - 持仓数量
 * @param {number} addMargin - 增加的保证金
 * @param {number} customInitialMargin - 自定义初始保证金（可选）
 * @returns {Object} {liquidationPrice, initialMargin, totalMargin}
 */
export function calculateLiquidation(leverage, openPrice, quantity, addMargin, customInitialMargin = null) {
    // 验证输入
    const validation = validator.validateRequiredFields({
        '开仓价格': openPrice,
        '数量': quantity
    });
    
    if (!validation.isValid) {
        throw new Error(validation.message);
    }
    
    // 如果没有自定义初始保证金，则需要验证杠杆倍数
    if (customInitialMargin === null || customInitialMargin <= 0) {
        if (!validator.isValidNumber(leverage) || !validator.isPositive(leverage)) {
            throw new Error('请输入杠杆倍数或初始保证金');
        }
        // 验证杠杆范围
        if (leverage < 1 || leverage > 125) {
            console.warn('杠杆倍数超出常规范围(1-125)');
        }
    }
    
    // 验证正数
    if (!validator.isPositive(openPrice)) {
        throw new Error('开仓价格必须大于0');
    }
    if (!validator.isPositive(quantity)) {
        throw new Error('数量必须大于0');
    }
    if (!validator.isNonNegative(addMargin)) {
        throw new Error('增加保证金不能为负数');
    }
    if (customInitialMargin !== null && !validator.isNonNegative(customInitialMargin)) {
        throw new Error('初始保证金不能为负数');
    }
    
    // 检查极端值
    if (validator.isExtremeValue(openPrice) || 
        validator.isExtremeValue(quantity) ||
        validator.isExtremeValue(addMargin) ||
        (customInitialMargin !== null && validator.isExtremeValue(customInitialMargin))) {
        throw new Error('输入值超出合理范围');
    }
    
    // 根据交易方向计算
    let result;
    if (config.isLong()) {
        result = calculateLongLiquidationPrice(
            parseFloat(leverage) || 0, 
            parseFloat(openPrice), 
            parseFloat(quantity),
            parseFloat(addMargin),
            customInitialMargin !== null ? parseFloat(customInitialMargin) : null
        );
    } else {
        result = calculateShortLiquidationPrice(
            parseFloat(leverage) || 0, 
            parseFloat(openPrice), 
            parseFloat(quantity),
            parseFloat(addMargin),
            customInitialMargin !== null ? parseFloat(customInitialMargin) : null
        );
    }
    
    // 验证结果
    if (!validator.isValidNumber(result.liquidationPrice) || result.liquidationPrice <= 0) {
        throw new Error('计算结果无效，请检查输入参数');
    }
    
    return {
        liquidationPrice: result.liquidationPrice,
        initialMargin: result.initialMargin,
        totalMargin: result.totalMargin,
        isWarning: leverage < 1 || leverage > 125
    };
}

/**
 * 初始化强平价格计算器UI
 */
export function initLiquidationCalculator() {
    const calculateBtn = document.getElementById('calculateLiquidation');
    const resultDiv = document.getElementById('liquidationResult');
    const errorP = document.getElementById('liquidationError');
    const leverageInput = document.getElementById('liqLeverage');
    const leverageWarning = document.getElementById('leverageWarning');
    
    if (!calculateBtn) return;
    
    // 监听杠杆倍数输入，显示警告
    if (leverageInput) {
        leverageInput.addEventListener('input', () => {
            const leverage = parseFloat(leverageInput.value);
            if (validator.isValidNumber(leverage) && (leverage < 1 || leverage > 125)) {
                leverageWarning.classList.remove('hidden');
            } else {
                leverageWarning.classList.add('hidden');
            }
        });
    }
    
    calculateBtn.addEventListener('click', () => {
        try {
            // 获取输入值
            const leverage = document.getElementById('liqLeverage').value;
            const openPrice = document.getElementById('liqOpenPrice').value;
            const quantity = document.getElementById('liqQuantity').value;
            const initialMargin = document.getElementById('liqInitialMargin').value;
            const addMargin = document.getElementById('liqAddMargin').value || 0;
            
            // 隐藏错误提示
            validator.hideError('liquidationError');
            
            // 计算强平价格
            // 如果用户输入了初始保证金，则使用自定义值；否则传null让函数自动计算
            const customInitialMargin = initialMargin && parseFloat(initialMargin) > 0 ? parseFloat(initialMargin) : null;
            const result = calculateLiquidation(leverage, openPrice, quantity, addMargin, customInitialMargin);
            
            // 显示结果
            const liqPriceEl = document.getElementById('liqPrice');
            const liqInitMarginEl = document.getElementById('liqInitMargin');
            const liqTotalMarginEl = document.getElementById('liqTotalMargin');
            
            liqPriceEl.textContent = validator.formatNumber(result.liquidationPrice, 4);
            liqInitMarginEl.textContent = validator.formatNumber(result.initialMargin, 4);
            liqTotalMarginEl.textContent = validator.formatNumber(result.totalMargin, 4);
            
            // 显示结果区域
            resultDiv.classList.remove('hidden');
            resultDiv.classList.add('fade-in');
            
        } catch (error) {
            // 显示错误
            validator.showError('liquidationError', error.message);
            resultDiv.classList.add('hidden');
        }
    });
    
    // 监听配置变更，自动重新计算
    config.addConfigListener((key, value) => {
        // 如果已经有结果显示，则自动重新计算
        if (!resultDiv.classList.contains('hidden')) {
            calculateBtn.click();
        }
    });
}

export default {
    calculateLiquidation,
    initLiquidationCalculator
};