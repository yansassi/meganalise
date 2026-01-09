import fs from 'fs';

const filePath = 'c:/Users/Yan Casa/OneDrive/VPS/Sistemas/Meganalise/dados_fornecido/instagram/Oct-09-2025_Jan-08-2026_4344312662557085.csv';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    const header = lines[0].split(',');

    console.log('Searching for "Palmeiras"...');

    let found = false;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('palmeiras')) {
            console.log(`\n--- MATCH FOUND at Line ${i} ---`);
            // Naive split (might break on commas in quotes, but usually works for basic numbers)
            // Ideally we used the regex matcher from before for robustness
            const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || line.split(',');

            header.forEach((h, idx) => {
                // Clean header key
                const key = h.replace(/['"]/g, '').trim();
                const val = parts[idx] ? parts[idx].trim() : 'UNDEFINED';

                if (['Visualizações', 'Link permanente', 'Salvamentos', 'Curtidas', 'Alcance'].some(k => key.includes(k))) {
                    console.log(`${key}: ${val}`);
                }
            });
            found = true;
            break; // Just show one
        }
    }

    if (!found) console.log('No match found for "Palmeiras"');

} catch (err) {
    console.error(err);
}
