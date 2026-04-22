const PocketBase = require('pocketbase/cjs');

async function checkPYDataContent() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const record = await pb.collection('instagram_audience_demographics').getOne('ndqq1304w9w3ytt');
        console.log('Followers History Data length:', record.followers_history_data ? record.followers_history_data.length : 'null');
        if (record.followers_history_data) {
            console.log('Sample history:', record.followers_history_data.slice(0, 2));
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkPYDataContent();
