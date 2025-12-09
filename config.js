// 全局配置模块

// 交易方向枚举
export const Direction = {
    LONG: 'long',   // 做多
    SHORT: 'short'  // 做空
};

// 全局配置状态
const config = {
    direction: Direction.LONG,  // 默认做多
    makerFeeRate: 0.0002,       // Maker手续费率 (0.02%)
    takerFeeRate: 0.0005,       // Taker手续费率 (0.05%)
    listeners: []               // 配置变更监听器
};

/**
 * 获取当前交易方向
 * @returns {string}
 */
export function getDirection() {
    return config.direction;
}

/**
 * 设置交易方向
 * @param {string} direction - 交易方向 (long/short)
 */
export function setDirection(direction) {
    if (direction !== Direction.LONG && direction !== Direction.SHORT) {
        console.error('Invalid direction:', direction);
        return;
    }
    config.direction = direction;
    notifyListeners('direction', direction);
}

/**
 * 判断是否为做多
 * @returns {boolean}
 */
export function isLong() {
    return config.direction === Direction.LONG;
}

/**
 * 判断是否为做空
 * @returns {boolean}
 */
export function isShort() {
    return config.direction === Direction.SHORT;
}

/**
 * 获取Maker手续费率
 * @returns {number}
 */
export function getMakerFeeRate() {
    return config.makerFeeRate;
}

/**
 * 设置Maker手续费率
 * @param {number} rate - 手续费率（百分比形式，如0.02表示0.02%）
 */
export function setMakerFeeRate(rate) {
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue < 0) {
        console.error('Invalid maker fee rate:', rate);
        return;
    }
    // 将百分比转换为小数
    config.makerFeeRate = rateValue / 100;
    notifyListeners('makerFeeRate', config.makerFeeRate);
}

/**
 * 获取Taker手续费率
 * @returns {number}
 */
export function getTakerFeeRate() {
    return config.takerFeeRate;
}

/**
 * 设置Taker手续费率
 * @param {number} rate - 手续费率（百分比形式，如0.05表示0.05%）
 */
export function setTakerFeeRate(rate) {
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue < 0) {
        console.error('Invalid taker fee rate:', rate);
        return;
    }
    // 将百分比转换为小数
    config.takerFeeRate = rateValue / 100;
    notifyListeners('takerFeeRate', config.takerFeeRate);
}

/**
 * 获取总手续费率（Maker + Taker）
 * @returns {number}
 */
export function getTotalFeeRate() {
    return config.makerFeeRate + config.takerFeeRate;
}

/**
 * 检查手续费率是否过高
 * @param {number} rate - 手续费率（小数形式）
 * @returns {boolean}
 */
export function isFeeRateTooHigh(rate) {
    return rate > 0.01; // 超过1%视为过高
}

/**
 * 添加配置变更监听器
 * @param {Function} listener - 监听器函数 (key, value) => void
 */
export function addConfigListener(listener) {
    if (typeof listener === 'function') {
        config.listeners.push(listener);
    }
}

/**
 * 移除配置变更监听器
 * @param {Function} listener - 监听器函数
 */
export function removeConfigListener(listener) {
    const index = config.listeners.indexOf(listener);
    if (index > -1) {
        config.listeners.splice(index, 1);
    }
}

/**
 * 通知所有监听器配置已变更
 * @param {string} key - 变更的配置项
 * @param {*} value - 新值
 */
function notifyListeners(key, value) {
    config.listeners.forEach(listener => {
        try {
            listener(key, value);
        } catch (error) {
            console.error('Error in config listener:', error);
        }
    });
}

/**
 * 获取所有配置
 * @returns {Object}
 */
export function getAllConfig() {
    return {
        direction: config.direction,
        makerFeeRate: config.makerFeeRate,
        takerFeeRate: config.takerFeeRate,
        totalFeeRate: getTotalFeeRate()
    };
}

/**
 * 重置为默认配置
 */
export function resetConfig() {
    config.direction = Direction.LONG;
    config.makerFeeRate = 0.0002;
    config.takerFeeRate = 0.0005;
    notifyListeners('reset', getAllConfig());
}

export default {
    Direction,
    getDirection,
    setDirection,
    isLong,
    isShort,
    getMakerFeeRate,
    setMakerFeeRate,
    getTakerFeeRate,
    setTakerFeeRate,
    getTotalFeeRate,
    isFeeRateTooHigh,
    addConfigListener,
    removeConfigListener,
    getAllConfig,
    resetConfig
};