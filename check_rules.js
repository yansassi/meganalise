const PocketBase = require('pocketbase/cjs');
require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });

const pb = new PocketBase(process.env.PB_URL || 'https://auth.meganalise.pro');

async function checkRules() {
    try {
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);

        const collections = [
            'tiktok_content',
            'tiktok_daily_metrics',
            'tiktok_audience_demographics'
        ];

        for (const name of collections) {
            try {
                const collection = await pb.collections.getOne(name);
                console.log(`\nCollection: ${name}`);
                console.log(`listRule: ${JSON.stringify(collection.listRule)}`);
                console.log(`viewRule: ${JSON.stringify(collection.viewRule)}`);
                console.log(`createRule: ${JSON.stringify(collection.createRule)}`);
                console.log(`updateRule: ${JSON.stringify(collection.updateRule)}`);
            } catch (e) {
                console.log(`Collection ${name} not found or error: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

checkRules();
