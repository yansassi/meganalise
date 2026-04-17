const PocketBase = require('pocketbase/cjs');

async function checkSchema() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        const collection = await pb.collections.getOne('evidence_registries');
        console.log('Collection:', collection.name);
        console.log('Fields:', JSON.stringify(collection.fields || collection.schema, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSchema();
