const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function test() {
    const f = 'Feb-01-2026_Apr-20-2026_1300625435364732.csv';
    const filePath = `c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebookdados/${f}`;
    const buffer = fs.readFileSync(filePath);
    const result = await parseFacebookCSV(buffer, f);
    console.log(`Total: ${result.data.length}`);
    console.log(`First item date: ${result.data[0].date}`);
    console.log(`First item title: ${result.data[0].title.substring(0, 50)}`);
}

test();
