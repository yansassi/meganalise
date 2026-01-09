import fs from 'fs';

const formatosPath = 'c:\\Users\\Yan Casa\\OneDrive\\VPS\\Sistemas\\Meganalise\\dados_fornecido\\instagram\\Principais formatos de conteúdo.csv';

console.log('=== PRINCIPAIS FORMATOS DE CONTEÚDO.CSV ===');
const formatosContent = fs.readFileSync(formatosPath, 'utf16le');
const formatosLines = formatosContent.split('\n');
console.log(`Total de linhas: ${formatosLines.length}`);
console.log('\nPrimeiras 30 linhas:');
console.log(formatosLines.slice(0, 30).join('\n'));

