const PocketBase = require('pocketbase/cjs');

async function checkRegistries() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for influencer type registries...');
        const records = await pb.collection('evidence_registries').getFullList({
            filter: 'type = "influencer"',
        });

        console.log('Total influencer registries:', records.length);
        records.forEach(r => {
            console.log('---');
            console.log('ID:', r.id);
            console.log('Title:', r.title);
            console.log('Keywords:', r.keywords);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRegistries();
