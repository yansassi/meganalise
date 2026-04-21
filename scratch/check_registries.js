const PocketBase = require('pocketbase/cjs');

async function checkRegistries() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Fetching last 5 evidence_registries...');
        const records = await pb.collection('evidence_registries').getList(1, 5, {
            sort: '-created',
        });

        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.id);
            console.log('Title:', r.title);
            console.log('Type:', r.type);
            console.log('Keywords:', r.keywords);
            console.log('Dates:', r.start_date, 'to', r.end_date);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRegistries();
