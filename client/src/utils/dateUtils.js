/**
 * Utilitários para manipulação de datas no dashboard.
 */

/**
 * Calcula o período anterior equivalente ao selecionado.
 * Útil para calcular tendências de crescimento/queda.
 * 
 * @param {string} startDate - Data de início (YYYY-MM-DD)
 * @param {string} endDate - Data de fim (YYYY-MM-DD)
 * @param {string} preset - O preset selecionado (opcional)
 * @returns {object} { startDate, endDate } do período anterior
 */
export const calcPreviousPeriod = (startDate, endDate, preset) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calcula a diferença em milissegundos
    const diffMs = end.getTime() - start.getTime();
    
    // O período anterior termina um dia antes do início atual
    const prevEnd = new Date(start.getTime() - (24 * 60 * 60 * 1000));
    
    // O período anterior começa retrocedendo a mesma diferença da duração atual
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    
    return {
        startDate: prevStart.toISOString().split('T')[0],
        endDate: prevEnd.toISOString().split('T')[0]
    };
};
