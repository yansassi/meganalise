import fs from 'fs';

const filePath = 'c:/Users/Yan Casa/OneDrive/VPS/Sistemas/Meganalise/dados_fornecido/instagram/Jan-10-2025_Jan-08-2026_1416659706530207.csv';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    console.log('--- RAW HEADER LINE ---');
    console.log(lines[0]);
    console.log('--- HEADER CHAR CODES ---');
    for (let i = 0; i < lines[0].length; i++) {
        // Print char and code to detect invisible chars
        process.stdout.write(`${lines[0][i]}(${lines[0].charCodeAt(i)}) `);
    }
    const header = lines[0].split(','); // Naive split for quick check
    const row = lines[1].split(','); // Naive split
    console.log('--- HEADER vs ROW 1 ---');
    header.forEach((h, i) => {
        console.log(`${i}: ${h.trim()} = ${row[i] ? row[i].trim() : 'UNDEFINED'}`);
    });

} catch (err) {
    console.error(err);
}
