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
            if (result.type === 'metric') {
                console.log(`Metric: ${result.metric}, Rows: ${result.data.length}`);
                if (result.data.length > 0) {
                   console.log('Sample data:', result.data[0]);
                }
            } else if (result.type === 'unknown') {
                console.log(`Message: ${result.message}`);
            } else {
                console.log(`Rows: ${result.data ? result.data.length : 'N/A'}`);
            }
        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
        console.log('---');
    }
}
test();
