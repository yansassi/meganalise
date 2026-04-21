require('dotenv').config();
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'https://pocketbase.meganalise.pro');

async function test() {
    try {
        console.log('Checking facebook_daily_metrics...');
        const metrics = await pb.collection('facebook_daily_metrics').getList(1, 10, {
            sort: '-date'
        });
        console.log(`Total records: ${metrics.totalItems}`);
        if (metrics.items.length > 0) {
            console.log('Sample records:', metrics.items.map(m => ({
                date: m.date,
                metric: m.metric,
                value: m.value,
                platform: m.platform,
                country: m.country
            })));
        }

        console.log('\nChecking facebook_content...');
        const content = await pb.collection('facebook_content').getList(1, 5, {
            sort: '-date'
        });
        console.log(`Total content: ${content.totalItems}`);
        if (content.items.length > 0) {
            console.log('Sample content:', content.items.map(c => ({
                date: c.date,
                title: c.title.substring(0, 30),
                social_network: c.social_network
            })));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
