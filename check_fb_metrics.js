const fs = require('fs');
const path = require('path');
const { parseFacebookCSV } = require('./server/services/parser');

async function check() {
    const file = './facebookdados/Apr-01-2026_Apr-19-2026_1281099350653611.csv';
    console.log(`Checking ${file}...`);
    const buffer = fs.readFileSync(file);
    const result = await parseFacebookCSV(buffer, path.basename(file));
    console.log(`Type returned: ${result.type}`);
    if (result.type === 'content') {
         console.log('It was parsed as CONTENT. Showing first 2 items:');
         console.log(result.data.slice(0, 2));
    } else {
         console.log(result);
    }
}
check();
