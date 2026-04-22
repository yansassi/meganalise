const fs = require('fs');
const parser = require('../server/services/parser');

async function testParse() {
    try {
        const filePath = 'instagramdados/P\u00fablico.csv';
        if (!fs.existsSync(filePath)) {
            console.log('File not found:', filePath);
            return;
        }
        const buffer = fs.readFileSync(filePath);
        const data = await parser.parseInstagramCSV(buffer, 'P\u00fablico.csv');
        
        console.log('Type:', data.type);
        const audienceData = data.data;
        console.log('Gender Age:', Object.keys(audienceData.gender_age).length);
        console.log('Cities:', audienceData.cities.length);
        console.log('Countries:', audienceData.countries.length);
        console.log('Followers History:', audienceData.followers_history.length);
        
        if (audienceData.followers_history.length > 0) {
            console.log('Sample History:', audienceData.followers_history[0]);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testParse();
