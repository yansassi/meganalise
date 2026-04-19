const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function checkFBFields() {
    try {
        console.log('Fetching 1 record from facebook_content...');
        const res = await pb.collection('facebook_content').getList(1, 1);
        if (res.items.length > 0) {
            console.log('Fields found in record:', Object.keys(res.items[0]).join(', '));
            console.log('Sample record:', JSON.stringify(res.items[0], null, 2));
        } else {
            console.log('No records in facebook_content.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkFBFields();
