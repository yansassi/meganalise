const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function checkSchema() {
    try {
        console.log('Fetching facebook_content collection info...');
        const collection = await pb.collections.getOne('facebook_content');
        console.log('Fields:', collection.schema.map(f => f.name).join(', '));
        
        console.log('\nFetching one record from facebook_content...');
        const records = await pb.collection('facebook_content').getList(1, 1);
        if (records.items.length > 0) {
            console.log('Record Sample:', JSON.stringify(records.items[0], null, 2));
        } else {
            console.log('No records found in facebook_content.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

checkSchema();
