const fs = require('fs');
const path = require('path');
const { parseFacebookCSV } = require('./server/services/parser');

async function debug() {
    const file = './facebookdados/Apr-01-2026_Apr-19-2026_1281099350653611.csv';
    const buffer = fs.readFileSync(file);
    const parsed = await parseFacebookCSV(buffer, path.basename(file));

    console.log("type:", parsed.type);
    console.log("data:", parsed.data);
}
debug();
