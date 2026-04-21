const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function test() {
    const f = 'Feb-01-2026_Apr-20-2026_1300625435364732.csv';
    const filePath = `c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebookdados/${f}`;
    const buffer = fs.readFileSync(filePath);
    const result = await parseFacebookCSV(buffer, f);
    
    const aprilRecords = result.data.filter(d => d.date && d.date.startsWith('2026-04'));
    console.log(`Total April records: ${aprilRecords.length}`);
    if (aprilRecords.length > 0) {
        console.log('Sample April record:', aprilRecords[0]);
    } else {
        const months = new Set(result.data.map(d => d.date ? d.date.substring(0, 7) : 'no-date'));
        console.log('Available months:', Array.from(months));
    }
}

test();
