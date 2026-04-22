const PocketBase = require('pocketbase/cjs');

async function checkParaguayAudience() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking audience data for country PY...');
        const audience = await pb.collection('instagram_audience').getFullList({
            filter: 'country = "PY" || country = "paraguay"',
        });

        console.log('Total audience records for PY:', audience.length);
        if (audience.length > 0) {
            console.log('Sample record country:', audience[0].country);
            console.log('Influencer ID:', audience[0].influencer_id);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkParaguayAudience();
