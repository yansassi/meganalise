const fs = require('fs');
const path = require('path');
const { parseInstagramCSV } = require('./server/services/parser');

(async () => {
    try {
        const filePath = path.join(__dirname, 'dados_fornecido', 'instagram', 'Oct-09-2025_Jan-08-2026_4344312662557085.csv');
        console.log(`Reading file: ${filePath}`);
        const buffer = fs.readFileSync(filePath);

        console.log('Parsing...');
        const result = await parseInstagramCSV(buffer, 'Oct-09-2025_Jan-08-2026_4344312662557085.csv');

        console.log('Result Type:', result.type);
        console.log('Count:', result.data.length);

        if (result.data.length > 0) {
            console.log('First Item:', result.data[0]);

            // check platform types
            const types = {};
            result.data.forEach(d => {
                types[d.platform] = (types[d.platform] || 0) + 1;
            });
            console.log('Platform Breakdown:', types);
        }

    } catch (err) {
        console.error('Error:', err);
    }
})();
