const PocketBase = require('pocketbase/cjs');

async function checkTotalCount() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const count = await pb.collection('instagram_content').getList(1, 1);
        console.log('Total instagram_content records:', count.totalItems);
        
        const storyCount = await pb.collection('instagram_content').getList(1, 1, {
            filter: 'platform_type = "story"'
        });
        console.log('Total STORIES:', storyCount.totalItems);

        const brandStoryCount = await pb.collection('instagram_content').getList(1, 1, {
            filter: 'platform_type = "story" && author = "megaeletronicosoficialpy"'
        });
        console.log('Total BRAND STORIES:', brandStoryCount.totalItems);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkTotalCount();
