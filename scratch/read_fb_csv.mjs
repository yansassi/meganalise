import fs from 'fs';
import { TextDecoder } from 'util';

const filePath = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados\\Visualizações.csv';
const buffer = fs.readFileSync(filePath);
const decoder = new TextDecoder('utf-16le');
const text = decoder.decode(buffer);

console.log('--- First 500 characters of Visualizações.csv ---');
console.log(text.substring(0, 500));
