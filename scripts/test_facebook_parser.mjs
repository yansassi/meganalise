import fs from 'fs';
import { parseFacebookCSV } from '../server/services/parser.js';

async function test() {
    const files = [
        { name: 'Visualizações.csv', path: 'c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebook-dados/Visualizações.csv' },
        { name: 'Visualizadores.csv', path: 'c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebook-dados/Visualizadores.csv' }
    ];

    for (const file of files) {
        console.log(`\nTesting file: ${file.name}`);
        try {
            const buffer = fs.readFileSync(file.path);
            const result = await parseFacebookCSV(buffer, file.name);
            console.log('Result type:', result.type);
            if (result.data && result.data.length > 0) {
                console.log('Detected metric:', result.data[0].metric);
                console.log('Sample data:', result.data[0]);
            } else {
                console.log('No data parsed or empty.');
            }
        } catch (err) {
            console.error('Error parsing file:', err.message);
        }
    }
}

test();
