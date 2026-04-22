const PocketBase = require('pocketbase/cjs');

async function checkWinieContent() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Searching for content of @dicadawinie...');
        const records = await pb.collection('instagram_content').getList(1, 20, {
            filter: 'author ~ "dicadawinie" || title ~ "dicadawinie"',
            sort: '-date',
        });

        console.log('Total records found:', records.totalItems);
        records.items.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Type:', r.platform_type);
            console.log('Author:', r.author);
            console.log('Title:', r.title ? r.title.substring(0, 50) : '(empty)');
            console.log('Date:', r.date);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinieContent();
