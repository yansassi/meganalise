const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function test() {
    const files = [
        'Feb-01-2026_Apr-20-2026_1300625435364732.csv',
        'Feb-01-2026_Apr-20-2026_1318105456840249.csv',
        'Feb-01-2026_Apr-20-2026_859829763815823.csv'
    ];

    for (const f of files) {
        const filePath = `c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebookdados/${f}`;
        const buffer = fs.readFileSync(filePath);
        const result = await parseFacebookCSV(buffer, f);
        
        const dates = result.data.map(d => d.date).filter(Boolean).sort();
        console.log(`File: ${f}`);
        console.log(`  Min date: ${dates[0]}`);
        console.log(`  Max date: ${dates[dates.length - 1]}`);
        console.log(`  Total: ${result.data.length}`);
    }
}

test();
