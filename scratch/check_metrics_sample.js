const PocketBase = require('pocketbase/cjs');

async function checkSampleRecord() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const record = await pb.collection('instagram_daily_metrics').getFirstListItem('');
        console.log('Record keys:', Object.keys(record));
        console.log('Full record:', JSON.stringify(record, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSampleRecord();
