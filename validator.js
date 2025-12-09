// 数据验证工具模块

/**
 * 验证是否为有效数字
 * @param {*} value - 待验证的值
 * @returns {boolean}
 */
export function isValidNumber(value) {
    return value !== '' && value !== null && value !== undefined && !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * 验证是否为正数
 * @param {*} value - 待验证的值
 * @returns {boolean}
 */
export function isPositive(value) {
    return isValidNumber(value) && parseFloat(value) > 0;
}

/**
 * 验证是否为非负数
 * @param {*} value - 待验证的值
 * @returns {boolean}
 */
export function isNonNegative(value) {
    return isValidNumber(value) && parseFloat(value) >= 0;
}

/**
 * 验证是否为空
 * @param {*} value - 待验证的值
 * @returns {boolean}
 */
export function isEmpty(value) {
    return value === '' || value === null || value === undefined;
}

/**
 * 检查是否为极端值
 * @param {number} value - 待检查的值
 * @returns {boolean}
 */
export function isExtremeValue(value) {
    if (!isValidNumber(value)) return false;
    const num = parseFloat(value);
    return !isFinite(num) || isNaN(num) || Math.abs(num) > 1e15;
}

/**
 * 验证数字范围
 * @param {*} value - 待验证的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
    if (!isValidNumber(value)) return false;
    const num = parseFloat(value);
    return num >= min && num <= max;
}

/**
 * 显示错误提示
 * @param {string} elementId - 错误提示元素的ID
 * @param {string} message - 错误消息
 */
export function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

/**
 * 隐藏错误提示
 * @param {string} elementId - 错误提示元素的ID
 */
export function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

/**
 * 验证所有必填字段
 * @param {Object} fields - 字段对象 {fieldName: value}
 * @returns {Object} {isValid: boolean, message: string}
 */
export function validateRequiredFields(fields) {
    for (const [fieldName, value] of Object.entries(fields)) {
        if (isEmpty(value)) {
            return {
                isValid: false,
                message: `请输入${fieldName}`
            };
        }
        if (!isValidNumber(value)) {
            return {
                isValid: false,
                message: `${fieldName}必须是有效数字`
            };
        }
    }
    return { isValid: true, message: '' };
}

/**
 * 格式化数字显示
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
export function formatNumber(value, decimals = 4) {
    if (!isValidNumber(value)) return '-';
    return parseFloat(value).toFixed(decimals);
}

/**
 * 格式化百分比显示
 * @param {number} value - 数值（小数形式）
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
export function formatPercentage(value, decimals = 2) {
    if (!isValidNumber(value)) return '-';
    return (parseFloat(value) * 100).toFixed(decimals) + '%';
}

/**
 * 安全解析浮点数
 * @param {*} value - 待解析的值
 * @param {number} defaultValue - 默认值
 * @returns {number}
 */
export function safeParseFloat(value, defaultValue = 0) {
    if (!isValidNumber(value)) return defaultValue;
    const parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : defaultValue;
}

export default {
    isValidNumber,
    isPositive,
    isNonNegative,
    isEmpty,
    isExtremeValue,
    isInRange,
    showError,
    hideError,
    validateRequiredFields,
    formatNumber,
    formatPercentage,
    safeParseFloat
};