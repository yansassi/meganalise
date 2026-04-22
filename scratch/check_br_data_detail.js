const PocketBase = require('pocketbase/cjs');

async function checkBRDataDetail() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const record = await pb.collection('instagram_audience_demographics').getFirstListItem('country = "BR"', { sort: '-import_date' });
        console.log('Country:', record.country);
        console.log('Followers History Data length:', record.followers_history_data ? record.followers_history_data.length : 'null');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkBRDataDetail();
