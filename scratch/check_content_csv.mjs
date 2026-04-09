import fs from 'fs';
import { TextDecoder } from 'util';

// Check the content file
const file = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados\\Jan-09-2026_Apr-08-2026_1502952904598658.csv';
const buffer = fs.readFileSync(file);

// Try UTF-16LE
const decoder16 = new TextDecoder('utf-16le');
let text = '';
try {
    text = decoder16.decode(buffer);
    // Check if it looks right (has readable text)
    if (text.charCodeAt(0) < 32 || text.charCodeAt(0) > 126) {
        throw new Error('Not UTF-16LE');
    }
} catch(e) {
    text = buffer.toString('utf8');
}

const lines = text.split('\n');
console.log('First 5 lines:');
for(let i = 0; i < 5; i++) {
    console.log(`Line ${i}: ${lines[i]?.substring(0, 200)}`);
}
