const PocketBase = require('pocketbase/cjs');

async function checkInfluencerRegistries() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking country for influencer registries...');
        const records = await pb.collection('evidence_registries').getFullList({
            filter: 'type = "influencer"',
        });

        records.forEach(r => {
            console.log('---');
            console.log('Title:', r.title);
            console.log('Country:', r.country);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkInfluencerRegistries();
