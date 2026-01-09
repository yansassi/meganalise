import fs from 'fs';

const filePath = 'c:/Users/Yan Casa/OneDrive/VPS/Sistemas/Meganalise/dados_fornecido/instagram/Oct-09-2025_Jan-08-2026_4344312662557085.csv';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    console.log('--- HEADERS ---');
    console.log(lines[0]);

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('palmeiras ou flamengo')) {
            console.log(`\n--- RAW LINE ${i} ---`);
            console.log(lines[i]);
            break;
        }
    }

} catch (err) {
    console.error(err);
}
