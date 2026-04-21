const PocketBase = require('pocketbase/cjs');

async function fixAuthorFromPermalink() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for stories with missing author...');
        const records = await pb.collection('instagram_content').getFullList({
            filter: '(author = "" || author = null) && permalink ~ "/stories/"',
        });

        console.log(`Found ${records.length} records to fix.`);

        for (const r of records) {
            const permalink = r.permalink || '';
            if (permalink.includes('instagram.com/stories/')) {
                const parts = permalink.split('instagram.com/stories/')[1].split('/');
                if (parts[0]) {
                    await pb.collection('instagram_content').update(r.id, {
                        author: parts[0]
                    });
                    process.stdout.write('.');
                }
            }
        }
        console.log('\nDone!');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

fixAuthorFromPermalink();
