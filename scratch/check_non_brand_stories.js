const PocketBase = require('pocketbase/cjs');

async function checkOtherStories() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for stories NOT from the brand...');
        const records = await pb.collection('instagram_content').getList(1, 20, {
            filter: 'platform_type = "story" && author != "megaeletronicosoficialpy"',
            sort: '-date',
        });

        console.log('Total non-brand stories found:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Author:', r.author);
            console.log('Type:', r.platform_type);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkOtherStories();
