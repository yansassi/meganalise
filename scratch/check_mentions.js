const PocketBase = require('pocketbase/cjs');

async function checkMentions() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for stories mentioning an influencer (@)...');
        const records = await pb.collection('instagram_content').getList(1, 10, {
            filter: 'title ~ "@" && permalink ~ "/stories/"',
            sort: '-date',
        });

        console.log('Total mentions found:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Title:', r.title);
            console.log('Author:', r.author);
            console.log('Permalink:', r.permalink);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkMentions();
