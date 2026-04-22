const PocketBase = require('pocketbase/cjs');

async function checkWinie2025() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for Winie in 2025...');
        const records = await pb.collection('instagram_content').getList(1, 20, {
            filter: 'author ~ "winie" && date < "2026-01-01"',
        });

        console.log('Total found in 2025:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Type:', r.platform_type);
            console.log('Date:', r.date);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinie2025();
