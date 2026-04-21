const PocketBase = require('pocketbase/cjs');

async function checkData() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Fetching last 10 Instagram content records...');
        const records = await pb.collection('instagram_content').getList(1, 10, {
            sort: '-created',
        });

        console.log('Total records:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Title:', r.title ? r.title.substring(0, 50) : '(empty)');
            console.log('Author:', r.author);
            console.log('Platform:', r.platform_type);
            console.log('Date:', r.date);
            console.log('Permalink:', r.permalink);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkData();
