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

/**
 * Format date string to DD/MM/YYYY using UTC components to prevent timezone shifts
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'data inválida';

    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
};
