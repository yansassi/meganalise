import fs from 'fs';

// Use Node.js built-in CSV parsing approach
const file = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados\\Jan-09-2026_Apr-08-2026_1502952904598658.csv';
const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');

// Simple hand-coded CSV parser
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

// Parse all lines
const lines = text.split('\n');

// First non-empty line should be the header
const headerLine = lines[0];
const headers = parseCSVLine(headerLine);
const dateColIdx = 16; // "Data" column
const horarioColIdx = 6; // "Horário de publicação" column

console.log(`Header[${horarioColIdx}]: ${headers[horarioColIdx]}`);
console.log(`Header[${dateColIdx}]: ${headers[dateColIdx]}`);

// Find first real data row (non-multiline)
let rowCount = 0;
let colCount = 0;
let currentRow = '';
let foundRows = [];

for (let i = 1; i < lines.length && foundRows.length < 10; i++) {
    currentRow += (currentRow ? '\n' : '') + lines[i];
    const cols = parseCSVLine(currentRow);
    
    // If we have enough columns, this is a complete row
    if (cols.length >= 17) {
        foundRows.push(cols);
        currentRow = '';
    }
}

foundRows.forEach((cols, i) => {
    console.log(`\nRow ${i+1}:`);
    console.log(`  ID: ${cols[0]}`);
    console.log(`  Horário de publicação (col ${horarioColIdx}): "${cols[horarioColIdx]}"`);
    console.log(`  Data (col ${dateColIdx}): "${cols[dateColIdx]}"`);
});
