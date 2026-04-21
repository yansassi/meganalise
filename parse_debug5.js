const fs = require('fs');
const path = require('path');
const { parseFacebookCSV } = require('./server/services/parser');

async function debug() {
    const file = './facebookdados/Apr-01-2026_Apr-19-2026_1281099350653611.csv';
    const buffer = fs.readFileSync(file);
    const Papa = require('papaparse');

    let decodedContent = buffer.toString('utf8');
    if (decodedContent.indexOf('') !== -1) {
        decodedContent = require('iconv-lite').decode(buffer, 'utf16le');
        if (decodedContent.indexOf('') !== -1) {
            decodedContent = require('iconv-lite').decode(buffer, 'latin1');
        }
    }

    // Remove "sep=," if present at the start (common in Excel CSV exports)
    if (decodedContent.trim().startsWith('sep=,')) {
        decodedContent = decodedContent.replace(/^sep=,[\r\n]+/, '');
    }

    const firstFewLines = decodedContent.split(/\r?\n/).slice(0, 10);
    let headerIndex = 0;

    for (let i = 0; i < Math.min(firstFewLines.length, 10); i++) {
        const line = firstFewLines[i].toLowerCase();
        if (line.includes('"data"') || line.includes('data,') || line.includes('data;') ||
            line.includes('"identificador') || line.includes('identificador') ||
            line.includes('alcance,') || line.includes('alcance;') ||
            line.includes('link permanente') || line.includes('permalink') ||
            line.includes('identificação da página')) {
            headerIndex = i;
            break;
        }
    }

    const lines = decodedContent.split(/\r?\n/);
    const cleanCSV = lines.slice(headerIndex).join('\n');

    const parsed = Papa.parse(cleanCSV, {
        header: true,
        skipEmptyLines: true,
        transformHeader:h=>h.trim()
    });

    const data = parsed.data;

    console.log("has engajamento in facebook parser?", data.length > 0 && Object.keys(data[0]).some(k => k.toLowerCase().includes('engajamento')));
    console.log("headers", Object.keys(data[0]));
}
debug();
