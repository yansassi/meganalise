const PocketBase = require('pocketbase/cjs');

async function listData() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        const records = await pb.collection('evidence_registries').getFullList({
            sort: '-created',
        });
        
        console.log('Total records:', records.length);
        records.slice(0, 10).forEach(r => {
            console.log(`ID: ${r.id} | Title: ${r.title} | Type: ${r.type} | Created: ${r.created}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listData();
