const PocketBase = require('pocketbase/cjs');

async function checkCountry() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking country for recent records...');
        const records = await pb.collection('instagram_content').getList(1, 5, {
            filter: 'date >= "2026-04-01 00:00:00"',
            sort: '-date',
        });

        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Country:', r.country);
            console.log('Date:', r.date);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkCountry();
