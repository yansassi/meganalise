const PocketBase = require('pocketbase/cjs');

async function checkWinieFB() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for Winie in Facebook content...');
        const records = await pb.collection('facebook_content').getList(1, 20, {
            filter: 'author ~ "winie" || title ~ "winie"',
        });

        console.log('Total found in FB:', records.totalItems);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinieFB();
