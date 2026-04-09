import fs from 'fs';
import { TextDecoder } from 'util';

const file = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados\\Jan-09-2026_Apr-08-2026_1502952904598658.csv';
const buffer = fs.readFileSync(file);
const text = buffer.toString('utf8').replace(/^\uFEFF/, '');

const lines = text.split('\n');
// Print header + first 3 data rows
console.log('=== Header ===');
console.log(lines[0].substring(0, 400));

console.log('\n=== Row 1 (full) ===');
// Find the position of Horário col
const headers = lines[0].split(',');
console.log('Headers count:', headers.length);
headers.forEach((h, i) => console.log(`  [${i}]: ${h.substring(0, 50)}`));

console.log('\n=== Trying CSV parse manually (split) ===');
for (let i = 1; i <= 3; i++) {
    // Each row may be multi-line due to description fields
    if (!lines[i]) continue;
    console.log(`Row ${i}: ${lines[i].substring(0, 300)}`);
}
