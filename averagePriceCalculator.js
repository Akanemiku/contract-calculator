// 开仓均价计算模块

import * as validator from './validator.js';
import * as config from './config.js';

// 存储开仓记录
let positions = [];

/**
 * 添加开仓记录
 * @param {number} quantity - 数量
 * @param {number} price - 价格
 * @returns {Object} 新增的记录
 */
export function addPosition(quantity, price) {
    // 验证输入
    const validation = validator.validateRequiredFields({
        '数量': quantity,
        '价格': price
    });
    
    if (!validation.isValid) {
        throw new Error(validation.message);
    }
    
    // 验证正数
    if (!validator.isPositive(quantity)) {
        throw new Error('数量必须大于0');
    }
    if (!validator.isPositive(price)) {
        throw new Error('价格必须大于0');
    }
    
    // 检查极端值
    if (validator.isExtremeValue(quantity) || validator.isExtremeValue(price)) {
        throw new Error('输入值超出合理范围');
    }
    
    // 计算含手续费的实际成本
    const makerRate = config.getMakerFeeRate();
    const fee = parseFloat(price) * makerRate;
    const actualCost = parseFloat(price) + fee;
    
    const position = {
        id: Date.now(),
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        fee: fee,
        actualCost: actualCost,
        totalCost: parseFloat(quantity) * actualCost
    };
    
    positions.push(position);
    return position;
}

/**
 * 删除开仓记录
 * @param {number} id - 记录ID
 */
export function removePosition(id) {
    positions = positions.filter(p => p.id !== id);
}

/**
 * 获取所有开仓记录
 * @returns {Array}
 */
export function getAllPositions() {
    return [...positions];
}

/**
 * 清空所有开仓记录
 */
export function clearPositions() {
    positions = [];
}

/**
 * 计算开仓均价
 * @returns {Object} {averagePrice, totalQuantity, totalCost}
 */
export function calculateAveragePrice() {
    if (positions.length === 0) {
        throw new Error('暂无开仓记录');
    }
    
    let totalQuantity = 0;
    let totalCost = 0;
    
    positions.forEach(position => {
        totalQuantity += position.quantity;
        totalCost += position.totalCost;
    });
    
    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    
    return {
        averagePrice: averagePrice,
        totalQuantity: totalQuantity,
        totalCost: totalCost
    };
}

/**
 * 渲染开仓记录列表
 */
function renderPositionList() {
    const listDiv = document.getElementById('positionList');
    if (!listDiv) return;
    
    if (positions.length === 0) {
        listDiv.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">暂无开仓记录</p>';
        return;
    }
    
    listDiv.innerHTML = positions.map(position => `
        <div class="flex items-center justify-between py-4 border-b border-gray-200" data-id="${position.id}">
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-gray-500 uppercase tracking-wider">数量</span>
                    <span class="text-base font-light text-gray-900">${validator.formatNumber(position.quantity, 4)}</span>
                </div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-gray-500 uppercase tracking-wider">价格</span>
                    <span class="text-base font-light text-gray-900">${validator.formatNumber(position.price, 4)}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400">含手续费</span>
                    <span class="text-xs text-gray-500">${validator.formatNumber(position.actualCost, 4)}</span>
                </div>
            </div>
            <button class="delete-position ml-6 text-red-400 hover:text-red-600 text-xl transition-colors" data-id="${position.id}">
                ×
            </button>
        </div>
    `).join('');
    
    // 绑定删除按钮事件
    listDiv.querySelectorAll('.delete-position').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removePosition(id);
            renderPositionList();
            updateAverageResult();
        });
    });
}

/**
 * 更新均价计算结果
 */
function updateAverageResult() {
    const resultDiv = document.getElementById('averageResult');
    const errorP = document.getElementById('averageError');
    
    if (!resultDiv) return;
    
    try {
        validator.hideError('averageError');
        
        if (positions.length === 0) {
            resultDiv.classList.add('hidden');
            return;
        }
        
        const result = calculateAveragePrice();
        
        document.getElementById('avgResultPrice').textContent = validator.formatNumber(result.averagePrice, 4);
        document.getElementById('avgTotalPosition').textContent = validator.formatNumber(result.totalQuantity, 4);
        document.getElementById('avgTotalCost').textContent = validator.formatNumber(result.totalCost, 4);
        
        resultDiv.classList.remove('hidden');
        resultDiv.classList.add('fade-in');
        
    } catch (error) {
        validator.showError('averageError', error.message);
        resultDiv.classList.add('hidden');
    }
}

/**
 * 生成Markdown格式的数据
 * @returns {string}
 */
export function exportToMarkdown() {
    if (positions.length === 0) {
        return '# 开仓记录\n\n暂无开仓记录';
    }
    
    const result = calculateAveragePrice();
    const direction = config.isLong() ? '做多' : '做空';
    const makerRate = (config.getMakerFeeRate() * 100).toFixed(4);
    
    let markdown = '# 开仓记录\n\n';
    markdown += `**交易方向**: ${direction}\n\n`;
    markdown += `**Maker手续费率**: ${makerRate}%\n\n`;
    markdown += '## 开仓明细\n\n';
    markdown += '| 序号 | 数量 | 价格 | 手续费 | 实际成本 | 总成本 |\n';
    markdown += '|------|------|------|--------|----------|--------|\n';
    
    positions.forEach((pos, index) => {
        markdown += `| ${index + 1} | ${validator.formatNumber(pos.quantity, 4)} | ${validator.formatNumber(pos.price, 4)} | ${validator.formatNumber(pos.fee, 4)} | ${validator.formatNumber(pos.actualCost, 4)} | ${validator.formatNumber(pos.totalCost, 4)} |\n`;
    });
    
    markdown += '\n## 汇总信息\n\n';
    markdown += `- **开仓均价**: ${validator.formatNumber(result.averagePrice, 4)} USDT\n`;
    markdown += `- **总持仓数量**: ${validator.formatNumber(result.totalQuantity, 4)}\n`;
    markdown += `- **总成本**: ${validator.formatNumber(result.totalCost, 4)} USDT\n`;
    markdown += `\n---\n\n`;
    markdown += `*导出时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    
    return markdown;
}

/**
 * 生成CSV格式的数据
 * @returns {string}
 */
export function exportToCSV() {
    if (positions.length === 0) {
        return '暂无开仓记录';
    }
    
    const result = calculateAveragePrice();
    const direction = config.isLong() ? '做多' : '做空';
    const makerRate = (config.getMakerFeeRate() * 100).toFixed(4);
    
    let csv = '开仓记录导出\n';
    csv += `交易方向,${direction}\n`;
    csv += `Maker手续费率,${makerRate}%\n`;
    csv += `导出时间,${new Date().toLocaleString('zh-CN')}\n`;
    csv += '\n';
    csv += '序号,数量,价格,手续费,实际成本,总成本\n';
    
    positions.forEach((pos, index) => {
        csv += `${index + 1},${pos.quantity},${pos.price},${pos.fee},${pos.actualCost},${pos.totalCost}\n`;
    });
    
    csv += '\n';
    csv += '汇总信息\n';
    csv += `开仓均价,${result.averagePrice}\n`;
    csv += `总持仓数量,${result.totalQuantity}\n`;
    csv += `总成本,${result.totalCost}\n`;
    
    return csv;
}

/**
 * 显示导出弹窗
 * @param {string} format - 导出格式 ('markdown' 或 'csv')
 */
function showExportModal(format) {
    if (positions.length === 0) {
        validator.showError('averageError', '暂无开仓记录可导出');
        return;
    }
    
    const data = format === 'markdown' ? exportToMarkdown() : exportToCSV();
    const modal = document.getElementById('exportModal');
    const dataContent = document.getElementById('exportDataContent');
    const formatTitle = document.getElementById('exportFormatTitle');
    
    if (!modal || !dataContent || !formatTitle) return;
    
    formatTitle.textContent = format === 'markdown' ? 'Markdown' : 'CSV';
    dataContent.textContent = data;
    modal.classList.remove('hidden');
    
    // 自动选中文本
    setTimeout(() => {
        dataContent.select();
    }, 100);
}

/**
 * 关闭导出弹窗
 */
function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 复制导出数据到剪贴板
 */
function copyExportData() {
    const dataContent = document.getElementById('exportDataContent');
    if (!dataContent) return;
    
    dataContent.select();
    document.execCommand('copy');
    
    // 显示复制成功提示
    const copyBtn = document.getElementById('copyExportBtn');
    if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制!';
        copyBtn.classList.add('bg-green-500');
        copyBtn.classList.remove('bg-blue-500');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('bg-green-500');
            copyBtn.classList.add('bg-blue-500');
        }, 2000);
    }
}

/**
 * 初始化开仓均价计算器UI
 */
export function initAveragePriceCalculator() {
    const addBtn = document.getElementById('addPosition');
    const quantityInput = document.getElementById('avgQuantity');
    const priceInput = document.getElementById('avgPrice');
    
    if (!addBtn) return;
    
    addBtn.addEventListener('click', () => {
        try {
            const quantity = quantityInput.value;
            const price = priceInput.value;
            
            validator.hideError('averageError');
            
            // 添加记录
            addPosition(quantity, price);
            
            // 清空输入
            quantityInput.value = '';
            priceInput.value = '';
            
            // 更新显示
            renderPositionList();
            updateAverageResult();
            
        } catch (error) {
            validator.showError('averageError', error.message);
        }
    });
    
    // 支持回车键添加
    [quantityInput, priceInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addBtn.click();
                }
            });
        }
    });
    
    // 导出按钮事件
    const exportMarkdownBtn = document.getElementById('exportMarkdown');
    const exportCSVBtn = document.getElementById('exportCSV');
    const closeModalBtn = document.getElementById('closeExportModal');
    const copyExportBtn = document.getElementById('copyExportBtn');
    
    if (exportMarkdownBtn) {
        exportMarkdownBtn.addEventListener('click', () => {
            showExportModal('markdown');
        });
    }
    
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            showExportModal('csv');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeExportModal);
    }
    
    if (copyExportBtn) {
        copyExportBtn.addEventListener('click', copyExportData);
    }
    
    // 点击弹窗外部关闭
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeExportModal();
            }
        });
    }
    
    // 监听配置变更，自动重新计算
    config.addConfigListener((key, value) => {
        // 手续费率变更时，需要重新计算所有记录的成本
        if (key === 'makerFeeRate') {
            // 重新计算所有记录
            const oldPositions = [...positions];
            positions = [];
            
            oldPositions.forEach(pos => {
                try {
                    addPosition(pos.quantity, pos.price);
                } catch (error) {
                    console.error('Error recalculating position:', error);
                }
            });
            
            renderPositionList();
            updateAverageResult();
        }
    });
    
    // 初始渲染
    renderPositionList();
}

export default {
    addPosition,
    removePosition,
    getAllPositions,
    clearPositions,
    calculateAveragePrice,
    exportToMarkdown,
    exportToCSV,
    initAveragePriceCalculator
};