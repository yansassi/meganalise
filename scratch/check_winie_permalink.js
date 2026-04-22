const PocketBase = require('pocketbase/cjs');

async function checkWiniePermalink() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for stories with "dicadawinie" in permalink...');
        const records = await pb.collection('instagram_content').getList(1, 20, {
            filter: 'platform_type = "story" && permalink ~ "dicadawinie"',
            sort: '-date',
        });

        console.log('Total found:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Permalink:', r.permalink);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWiniePermalink();
