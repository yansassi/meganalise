const PocketBase = require('pocketbase/cjs');

async function checkData() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for records from April 2026...');
        const records = await pb.collection('instagram_content').getList(1, 10, {
            filter: 'date >= "2026-04-01 00:00:00"',
            sort: '-date',
        });

        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Platform Type:', r.platform_type);
            console.log('Author:', r.author);
            console.log('Permalink:', r.permalink);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkData();
