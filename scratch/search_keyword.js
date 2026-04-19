const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function searchLattafa() {
    try {
        console.log('Searching for "lattafa" in all content collections...');
        const collections = ['instagram_content', 'facebook_content', 'tiktok_content', 'youtube_content'];
        
        for (const coll of collections) {
            const res = await pb.collection(coll).getList(1, 5, {
                filter: 'title ~ "lattafa" || author ~ "lattafa"',
            });
            console.log(`${coll}: Found ${res.totalItems} items.`);
            if (res.items.length > 0) {
                res.items.forEach(i => {
                    console.log(`  - [${i.platform_type || i.platform}] ${i.title} (by ${i.author})`);
                });
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

searchLattafa();
