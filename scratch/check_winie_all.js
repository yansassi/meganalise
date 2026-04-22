const PocketBase = require('pocketbase/cjs');

async function checkWinieAll() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for ALL records related to "winie"...');
        const records = await pb.collection('instagram_content').getList(1, 100, {
            filter: 'author ~ "winie" || title ~ "winie"',
            sort: '-date',
        });

        const types = {};
        records.items.forEach(r => {
            types[r.platform_type] = (types[r.platform_type] || 0) + 1;
        });

        console.log('Results by type:', types);
        console.log('Sample authors:', [...new Set(records.items.map(r => r.author))]);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinieAll();
