import fs from 'fs';
import Papa from 'papaparse';

// Need to use papaparse - check if it exists
const file = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados\\Jan-09-2026_Apr-08-2026_1502952904598658.csv';
const content = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');

const result = Papa.parse(content, {
    header: true,
    delimiter: ',',
    skipEmptyLines: true
});

console.log('Headers:', result.meta.fields);
console.log('\nFirst 3 rows:');
result.data.slice(0, 3).forEach((row, i) => {
    console.log(`\nRow ${i}:`);
    Object.entries(row).forEach(([k, v]) => {
        if (v && k.toLowerCase().includes('horário') || k.toLowerCase().includes('publicação') || k.toLowerCase().includes('time')) {
            console.log(`  ${k}: ${v}`);
        }
    });
    console.log('  Horário de publicação:', row['Horário de publicação']);
});
