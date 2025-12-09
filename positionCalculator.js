// 仓位计算模块

import * as validator from './validator.js';
import * as config from './config.js';

/**
 * 通过止损幅度计算开仓数量
 * 公式：开仓数量 = 计划亏损金额(R) / 止损幅度(ΔP)
 * @param {number} plannedLoss - 计划亏损金额 (R)
 * @param {number} stopLossAmount - 止损幅度 (ΔP)
 * @returns {Object}
 */
function calculatePositionByAmount(plannedLoss, stopLossAmount) {
    // 开仓数量 = 计划亏损金额(R) / 止损幅度(ΔP)
    const quantity = plannedLoss / stopLossAmount;
    
    return {
        quantity: quantity,
        stopLossAmount: stopLossAmount,
        calculationType: 'amount' // 标记计算类型
    };
}

/**
 * 通过止损百分比计算开仓价值
 * 公式：开仓价值 = 计划亏损金额(R) / 止损百分比
 * @param {number} plannedLoss - 计划亏损金额 (R)
 * @param {number} stopLossPercent - 止损百分比 (%)
 * @returns {Object}
 */
function calculatePositionByPercent(plannedLoss, stopLossPercent) {
    // 将百分比转换为小数
    const percentDecimal = stopLossPercent / 100;
    
    // 开仓价值 = 计划亏损金额(R) / 止损百分比
    const positionValue = plannedLoss / percentDecimal;
    
    return {
        positionValue: positionValue,
        stopLossPercent: stopLossPercent,
        calculationType: 'percent' // 标记计算类型
    };
}

/**
 * 计算仓位（根据输入参数自动选择计算方式）
 * @param {number} plannedLoss - 计划亏损金额
 * @param {number} stopLossAmount - 止损幅度（可选）
 * @param {number} stopLossPercent - 止损百分比（可选）
 * @returns {Object}
 */
export function calculatePosition(plannedLoss, stopLossAmount = null, stopLossPercent = null) {
    // 验证计划亏损金额
    const validation = validator.validateRequiredFields({
        '计划亏损金额': plannedLoss
    });
    
    if (!validation.isValid) {
        throw new Error(validation.message);
    }
    
    // 验证正数
    if (!validator.isPositive(plannedLoss)) {
        throw new Error('计划亏损金额必须大于0');
    }
    
    // 检查极端值
    if (validator.isExtremeValue(plannedLoss)) {
        throw new Error('计划亏损金额超出合理范围');
    }
    
    // 确定使用哪种计算方式
    let result;
    
    if (stopLossAmount !== null && validator.isValidNumber(stopLossAmount)) {
        // 方式1：通过止损幅度计算数量
        const amount = parseFloat(stopLossAmount);
        
        if (!validator.isPositive(amount)) {
            throw new Error('止损幅度必须大于0');
        }
        
        if (validator.isExtremeValue(amount)) {
            throw new Error('止损幅度超出合理范围');
        }
        
        result = calculatePositionByAmount(parseFloat(plannedLoss), amount);
        
    } else if (stopLossPercent !== null && validator.isValidNumber(stopLossPercent)) {
        // 方式2：通过止损百分比计算价值
        const percent = parseFloat(stopLossPercent);
        
        if (!validator.isPositive(percent)) {
            throw new Error('止损百分比必须大于0');
        }
        
        if (percent > 100) {
            throw new Error('止损百分比不能超过100%');
        }
        
        result = calculatePositionByPercent(parseFloat(plannedLoss), percent);
        
    } else {
        throw new Error('请输入止损幅度或止损百分比');
    }
    
    return result;
}

/**
 * 初始化仓位计算器UI
 */
export function initPositionCalculator() {
    const calculateBtn = document.getElementById('calculatePosition');
    const resultDiv = document.getElementById('positionResult');
    const errorP = document.getElementById('positionError');
    
    // 输入模式切换
    const stopLossAmountInput = document.getElementById('posStopLossAmount');
    const stopLossPercentInput = document.getElementById('posStopLossPercent');
    
    if (!calculateBtn) return;
    
    // 监听止损幅度输入，清空百分比
    if (stopLossAmountInput) {
        stopLossAmountInput.addEventListener('input', () => {
            if (stopLossAmountInput.value) {
                stopLossPercentInput.value = '';
            }
        });
    }
    
    // 监听止损百分比输入，清空幅度
    if (stopLossPercentInput) {
        stopLossPercentInput.addEventListener('input', () => {
            if (stopLossPercentInput.value) {
                stopLossAmountInput.value = '';
            }
        });
    }
    
    calculateBtn.addEventListener('click', () => {
        try {
            // 获取输入值
            const plannedLoss = document.getElementById('posPlannedLoss').value;
            const stopLossAmount = document.getElementById('posStopLossAmount').value;
            const stopLossPercent = document.getElementById('posStopLossPercent').value;
            
            // 隐藏错误提示
            validator.hideError('positionError');
            
            // 计算仓位
            const result = calculatePosition(
                plannedLoss,
                stopLossAmount || null,
                stopLossPercent || null
            );
            
            // 显示结果
            const posQuantityEl = document.getElementById('posQuantity');
            const posValueEl = document.getElementById('posValue');
            
            if (!posQuantityEl || !posValueEl) {
                throw new Error('结果显示元素未找到');
            }
            
            if (result.calculationType === 'amount') {
                // 通过止损幅度计算的结果：显示数量
                posQuantityEl.textContent = validator.formatNumber(result.quantity, 4);
                posValueEl.textContent = '-';
                
            } else if (result.calculationType === 'percent') {
                // 通过止损百分比计算的结果：显示价值
                posQuantityEl.textContent = '-';
                posValueEl.textContent = validator.formatNumber(result.positionValue, 2) + ' USDT';
            }
            
            // 显示结果区域
            resultDiv.classList.remove('hidden');
            resultDiv.classList.add('fade-in');
            
        } catch (error) {
            // 显示错误
            validator.showError('positionError', error.message);
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
    calculatePosition,
    initPositionCalculator
};
