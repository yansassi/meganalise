const PocketBase = require('pocketbase/cjs');

async function checkWinieTikTok() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for Winie in TikTok content...');
        const records = await pb.collection('tiktok_content').getList(1, 20, {
            filter: 'author ~ "winie" || title ~ "winie"',
        });

        console.log('Total found in TikTok:', records.totalItems);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinieTikTok();
