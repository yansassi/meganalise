/**
 * Format number to integer string with thousand separators.
 * Removes all decimals.
 * @param {number|string} value 
 * @returns {string} Formatted string (e.g., "1.234")
 */
export const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '0';

    // Convert to number
    const num = Number(value);

    // If NaN, return original value or 0
    if (isNaN(num)) return value;

    // Round to integer and format
    return Math.round(num).toLocaleString('pt-BR');
};
