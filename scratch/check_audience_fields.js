const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function checkFields() {
    try {
        console.log('Checking fields for instagram_audience_demographics...');
        const res = await pb.collection('instagram_audience_demographics').getList(1, 1);
        if (res.items.length > 0) {
            console.log('Item keys:', Object.keys(res.items[0]).join(', '));
        } else {
            console.log('No items found to check keys.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkFields();
