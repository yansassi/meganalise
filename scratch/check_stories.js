const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function checkStories() {
    try {
        console.log('Checking instagram_content for stories...');
        const igStories = await pb.collection('instagram_content').getList(1, 10, {
            filter: 'platform_type = "story"',
            sort: '-created'
        });
        console.log(`Found ${igStories.totalItems} Instagram stories.`);
        if (igStories.items.length > 0) {
            console.log('Sample Story:', JSON.stringify(igStories.items[0], null, 2));
        }

        console.log('\nChecking facebook_content for stories...');
        const fbStories = await pb.collection('facebook_content').getList(1, 10, {
            filter: 'platform_type = "story"',
            sort: '-created'
        });
        console.log(`Found ${fbStories.totalItems} Facebook stories.`);
        if (fbStories.items.length > 0) {
            console.log('Sample Story:', JSON.stringify(fbStories.items[0], null, 2));
        }
        
        console.log('\nChecking overall content for stories (no platform_type filter)...');
        const allFb = await pb.collection('facebook_content').getList(1, 10, {
            sort: '-created'
        });
        console.log(`Total Facebook items: ${allFb.totalItems}`);
        const fbStoryManual = allFb.items.filter(i => (i.title || '').toLowerCase().includes('story'));
        console.log(`Manual check for "story" in title (Facebook): ${fbStoryManual.length} in sample.`);

    } catch (err) {
        console.error('Error:', err);
    }
}

checkStories();
