const PocketBase = require('pocketbase/cjs');

async function checkPYDataDetail() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const record = await pb.collection('instagram_audience_demographics').getOne('ndqq1304w9w3ytt');
        console.log('Gender Age Data:', JSON.stringify(record.gender_age_data).substring(0, 100));
        console.log('Cities Data length:', record.cities_data ? record.cities_data.length : 'null');
        console.log('Countries Data length:', record.countries_data ? record.countries_data.length : 'null');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkPYDataDetail();
