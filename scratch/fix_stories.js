const PocketBase = require('pocketbase/cjs');

async function fixPlatformType() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for miscategorized stories...');
        // Query records that have /stories/ in permalink but platform_type is 'social'
        const records = await pb.collection('instagram_content').getFullList({
            filter: 'permalink ~ "/stories/" && platform_type = "social"',
        });

        console.log(`Found ${records.length} records to fix.`);

        for (const r of records) {
            await pb.collection('instagram_content').update(r.id, {
                platform_type: 'story'
            });
            process.stdout.write('.');
        }
        console.log('\nDone!');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

fixPlatformType();
