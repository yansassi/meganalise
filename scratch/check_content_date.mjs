import fs from 'fs';
import { TextDecoder } from 'util';

// Check the content file
const file = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados\\Jan-09-2026_Apr-08-2026_1502952904598658.csv';
const buffer = fs.readFileSync(file);
const text = buffer.toString('utf8');

// Find the "Horário de publicação" column
const lines = text.split('\n');
const headers = lines[0].replace(/^\uFEFF/, '').split(',');
const dateColIdx = headers.findIndex(h => h.includes('Horário') || h.includes('publicação') || h.toLowerCase().includes('time'));
console.log('Headers:', headers.slice(0, 12).join(' | '));
console.log('Date column index:', dateColIdx, '=', headers[dateColIdx]);

// Get a few sample date values
for (let i = 1; i <= 5; i++) {
    const cols = lines[i]?.split(',');
    if (cols && dateColIdx >= 0) {
        console.log(`Row ${i} date:`, cols[dateColIdx]);
    }
}
