const fs = require('fs');
const path = require('path');
const { parseFacebookCSV } = require('./server/services/parser');

async function test() {
    const dir = './facebookdados';
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (!file.endsWith('.csv')) continue;
        console.log(`Testing file: ${file}`);
        const buffer = fs.readFileSync(path.join(dir, file));
        try {
            const result = await parseFacebookCSV(buffer, file);
            console.log(`Result type: ${result.type}`);
            if (result.data && result.data.length > 0) {
                console.log(result.data);
            }
        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
        console.log('---');
    }
}
test();
