import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

const filePath = 'c:/Users/Yan Casa/OneDrive/VPS/Sistemas/Meganalise/dados_fornecido/instagram/Jan-10-2025_Jan-08-2026_1416659706530207.csv';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Check first line manually
    const lines = fileContent.split('\n');
    console.log('--- Raw Header (Line 0) ---');
    console.log(lines[0]);

    // Parse with Papa
    Papa.parse(fileContent, {
        header: true,
        preview: 3, // Only first 3 rows
        complete: (results) => {
            console.log('\n--- PapaParse Headers ---');
            console.log(results.meta.fields);

            if (results.data.length > 0) {
                console.log('\n--- First Row Keys/Values ---');
                const row = results.data[0];
                Object.keys(row).forEach(key => {
                    if (key.toLowerCase().includes('link')) {
                        console.log(`[MATCH FOUND] Key: "${key}", Value: "${row[key]}"`);
                    }
                });

                // Explicit check
                console.log('\nChecking "Link permanente":', row['Link permanente']);
            }
        }
    });

} catch (err) {
    console.error('Error reading file:', err);
}
