const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function test() {
    const f = 'Feb-01-2026_Apr-20-2026_1300625435364732.csv';
    const filePath = `c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebookdados/${f}`;
    const buffer = fs.readFileSync(filePath);
    const result = await parseFacebookCSV(buffer, f);
    
    const dates = result.data.map(d => d.date).filter(Boolean).sort();
    console.log(`Min date: ${dates[0]}`);
    console.log(`Max date: ${dates[dates.length - 1]}`);
}

test();
