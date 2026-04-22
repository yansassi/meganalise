const PocketBase = require('pocketbase/cjs');

async function checkPYDemographics() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking demographics for PY...');
        const demographics = await pb.collection('instagram_audience_demographics').getFullList({
            filter: 'country = "PY"',
        });

        console.log('Total demographics records for PY:', demographics.length);
        if (demographics.length > 0) {
            console.log('ID:', demographics[0].id);
            console.log('Import Date:', demographics[0].import_date);
            console.log('Country:', demographics[0].country);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkPYDemographics();
