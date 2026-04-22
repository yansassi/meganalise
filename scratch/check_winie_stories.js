const PocketBase = require('pocketbase/cjs');

async function checkWinieStories() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for STORIES of @dicadawinie...');
        const records = await pb.collection('instagram_content').getList(1, 20, {
            filter: 'platform_type = "story" && (author ~ "dicadawinie" || title ~ "dicadawinie")',
            sort: '-date',
        });

        console.log('Total STORIES found:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Author:', r.author);
            console.log('Title:', r.title);
            console.log('Permalink:', r.permalink);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinieStories();
