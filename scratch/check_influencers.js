const PocketBase = require('pocketbase/cjs');

async function checkInfluencers() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Fetching influencers...');
        const records = await pb.collection('influencers').getFullList();

        records.forEach(r => {
            console.log('---');
            console.log('Name:', r.name);
            console.log('Keywords:', r.keywords);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkInfluencers();
