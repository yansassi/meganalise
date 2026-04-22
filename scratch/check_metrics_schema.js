const PocketBase = require('pocketbase/cjs');

async function checkSchema() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const collection = await pb.collections.getOne('instagram_daily_metrics');
        console.log('Fields:');
        collection.schema.forEach(f => {
            console.log(`- ${f.name} (${f.type})`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSchema();
