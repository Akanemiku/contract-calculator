// 收益额计算模块

import * as validator from './validator.js';
import * as config from './config.js';

/**
 * 计算开仓手续费
 * @param {number} position - 持仓数量
 * @param {number} openPrice - 开仓价格
 * @returns {number}
 */
function calculateOpenFee(position, openPrice) {
    const makerRate = config.getMakerFeeRate();
    return position * openPrice * makerRate;
}

/**
 * 计算平仓手续费
 * @param {number} position - 持仓数量
 * @param {number} closePrice - 平仓价格
 * @returns {number}
 */
function calculateCloseFee(position, closePrice) {
    const takerRate = config.getTakerFeeRate();
    return position * closePrice * takerRate;
}

/**
 * 计算做多收益
 * @param {number} position - 持仓数量
 * @param {number} openPrice - 开仓价格
 * @param {number} currentPrice - 当前价格
 * @returns {Object} {profit, profitRate, totalFee}
 */
function calculateLongProfit(position, openPrice, currentPrice) {
    // 价格差收益
    const priceDiff = currentPrice - openPrice;
    const grossProfit = position * priceDiff;
    
    // 计算手续费
    const openFee = calculateOpenFee(position, openPrice);
    const closeFee = calculateCloseFee(position, currentPrice);
    const totalFee = openFee + closeFee;
    
    // 净收益
    const netProfit = grossProfit - totalFee;
    
    // 收益率（相对于开仓成本）
    const cost = position * openPrice;
    const profitRate = cost > 0 ? netProfit / cost : 0;
    
    return {
        profit: netProfit,
        profitRate: profitRate,
        totalFee: totalFee,
        openFee: openFee,
        closeFee: closeFee
    };
}

/**
 * 计算做空收益
 * @param {number} position - 持仓数量
 * @param {number} openPrice - 开仓价格
 * @param {number} currentPrice - 当前价格
 * @returns {Object} {profit, profitRate, totalFee}
 */
function calculateShortProfit(position, openPrice, currentPrice) {
    // 价格差收益（做空时价格下跌为盈利）
    const priceDiff = openPrice - currentPrice;
    const grossProfit = position * priceDiff;
    
    // 计算手续费
    const openFee = calculateOpenFee(position, openPrice);
    const closeFee = calculateCloseFee(position, currentPrice);
    const totalFee = openFee + closeFee;
    
    // 净收益
    const netProfit = grossProfit - totalFee;
    
    // 收益率（相对于开仓成本）
    const cost = position * openPrice;
    const profitRate = cost > 0 ? netProfit / cost : 0;
    
    return {
        profit: netProfit,
        profitRate: profitRate,
        totalFee: totalFee,
        openFee: openFee,
        closeFee: closeFee
    };
}

/**
 * 计算收益（根据当前交易方向）
 * @param {number} leverage - 杠杆倍数
 * @param {number} openPrice - 开仓价格
 * @param {number} closePrice - 平仓价格
 * @param {number} quantity - 开仓数量
 * @returns {Object} {profit, profitRate, makerFee, takerFee}
 */
export function calculateProfit(leverage, openPrice, closePrice, quantity) {
    // 验证输入
    const validation = validator.validateRequiredFields({
        '杠杆倍数': leverage,
        '开仓价格': openPrice,
        '平仓价格': closePrice,
        '开仓数量': quantity
    });
    
    if (!validation.isValid) {
        throw new Error(validation.message);
    }
    
    // 验证正数
    if (!validator.isPositive(leverage)) {
        throw new Error('杠杆倍数必须大于0');
    }
    if (!validator.isPositive(openPrice)) {
        throw new Error('开仓价格必须大于0');
    }
    if (!validator.isPositive(closePrice)) {
        throw new Error('平仓价格必须大于0');
    }
    if (!validator.isPositive(quantity)) {
        throw new Error('开仓数量必须大于0');
    }
    
    // 检查极端值
    if (validator.isExtremeValue(leverage) ||
        validator.isExtremeValue(openPrice) || 
        validator.isExtremeValue(closePrice) || 
        validator.isExtremeValue(quantity)) {
        throw new Error('输入值超出合理范围');
    }
    
    // 根据交易方向计算
    if (config.isLong()) {
        return calculateLongProfit(quantity, openPrice, closePrice);
    } else {
        return calculateShortProfit(quantity, openPrice, closePrice);
    }
}

/**
 * 初始化收益计算器UI
 */
export function initProfitCalculator() {
    const calculateBtn = document.getElementById('calculateProfit');
    const resultDiv = document.getElementById('profitResult');
    const errorP = document.getElementById('profitError');
    
    if (!calculateBtn) return;
    
    calculateBtn.addEventListener('click', () => {
        try {
            // 获取输入值
            const leverage = document.getElementById('profitLeverage').value;
            const openPrice = document.getElementById('profitOpenPrice').value;
            const closePrice = document.getElementById('profitClosePrice').value;
            const quantity = document.getElementById('profitQuantity').value;
            
            // 隐藏错误提示
            validator.hideError('profitError');
            
            // 计算收益
            const result = calculateProfit(leverage, openPrice, closePrice, quantity);
            
            // 显示结果
            const profitAmountEl = document.getElementById('profitAmount');
            const profitRateEl = document.getElementById('profitRate');
            const profitMakerFeeEl = document.getElementById('profitMakerFee');
            const profitTakerFeeEl = document.getElementById('profitTakerFee');
            
            // 设置收益额颜色
            const profitClass = result.profit >= 0 ? 'text-green-600' : 'text-red-600';
            profitAmountEl.className = `font-semibold ${profitClass}`;
            profitAmountEl.textContent = validator.formatNumber(result.profit, 4);
            
            // 设置收益率颜色
            profitRateEl.className = `font-semibold ${profitClass}`;
            profitRateEl.textContent = validator.formatPercentage(result.profitRate, 2);
            
            // 显示手续费
            profitMakerFeeEl.textContent = validator.formatNumber(result.openFee, 4);
            profitTakerFeeEl.textContent = validator.formatNumber(result.closeFee, 4);
            
            // 显示结果区域
            resultDiv.classList.remove('hidden');
            resultDiv.classList.add('fade-in');
            
        } catch (error) {
            // 显示错误
            validator.showError('profitError', error.message);
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
    calculateProfit,
    initProfitCalculator
};