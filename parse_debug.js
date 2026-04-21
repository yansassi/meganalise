const fs = require('fs');
const path = require('path');
const { parseFacebookCSV } = require('./server/services/parser');

async function debug() {
    const file = './facebookdados/Apr-01-2026_Apr-19-2026_1281099350653611.csv';
    const buffer = fs.readFileSync(file);
    let decodedContent = buffer.toString('utf8');
    if (decodedContent.indexOf('') !== -1) {
        decodedContent = require('iconv-lite').decode(buffer, 'utf16le');
        if (decodedContent.indexOf('') !== -1) {
            decodedContent = require('iconv-lite').decode(buffer, 'latin1');
        }
    }

    // Simulating parser logic
    let firstFewLines = decodedContent.split('\n').slice(0, 10);
    console.log("First line:");
    console.log(firstFewLines[0]);

    let isMetric = false;
    let fileNameLower = path.basename(file).toLowerCase();

    let hasEngagements = firstFewLines[0].toLowerCase().includes('engajamentos') || firstFewLines[0].toLowerCase().includes('intera');

    console.log('hasEngagements:', hasEngagements);
}
debug();
