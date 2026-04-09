// Test the parseDate function with the exact values from Facebook CSV
// Replicating parser.js logic

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const str = dateStr.trim();
    
    // 1. DD/MM/YYYY or DD-MM-YYYY
    const ptBrMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ptBrMatch) {
        const [_, day, month, year] = ptBrMatch;
        console.log(`  -> DD/MM/YYYY match: day=${day}, month=${month}, year=${year}`);
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    console.log('  -> No DD/MM/YYYY match');
    return null;
};

const testDates = [
    '01/10/2026 08:59',
    '"01/10/2026 08:59"',
    '04/07/2026 16:59',
    '1/9/2026',
    'Total'
];

testDates.forEach(d => {
    console.log(`\nInput: "${d}"`);
    const result = parseDate(d);
    console.log(`Result: ${result}`);
    
    if (result) {
        const isoDate = new Date(result + 'T12:00:00.000Z').toISOString();
        console.log(`ISO: ${isoDate}`);
    }
});
