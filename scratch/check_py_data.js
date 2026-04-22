const PocketBase = require('pocketbase/cjs');

async function checkParaguayData() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking instagram_daily_metrics for PY...');
        const growth = await pb.collection('instagram_daily_metrics').getFullList({
            filter: 'country = "PY" || country = "paraguay"',
        });
        console.log('Total growth records for PY:', growth.length);

        console.log('Checking instagram_audience_demographics for PY...');
        const demographics = await pb.collection('instagram_audience_demographics').getFullList({
            filter: 'country = "PY" || country = "paraguay"',
        });
        console.log('Total demographics records for PY:', demographics.length);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkParaguayData();
