const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function checkDates() {
    try {
        const records = await pb.collection('instagram_content').getList(1, 5, {
            sort: '-created'
        });
        console.log('--- RECENT RECORDS ---');
        records.items.forEach(r => {
            console.log(`ID: ${r.id} | Date: ${r.date} | Title: ${r.title.substring(0, 20)}...`);
        });
    } catch (err) {
        console.error(err);
    }
}

checkDates();
