import PocketBase from 'pocketbase';

const pb = new PocketBase('https://auth.meganalise.pro');

async function checkFacebookData() {
    try {
        console.log('--- Checking facebook_daily_metrics ---');
        const metrics = await pb.collection('facebook_daily_metrics').getList(1, 10, {
            sort: '-created',
        });
        console.log('Latest 10 metrics:', JSON.stringify(metrics.items, null, 2));

        console.log('\n--- Checking facebook_content ---');
        const content = await pb.collection('facebook_content').getList(1, 10, {
            sort: '-created',
        });
        console.log('Latest 10 content items:', JSON.stringify(content.items, null, 2));

        // Let's also check if there are any records at all
        const totalMetrics = await pb.collection('facebook_daily_metrics').getList(1, 1);
        const totalContent = await pb.collection('facebook_content').getList(1, 1);
        console.log(`\nTotals: Metrics=${totalMetrics.totalItems}, Content=${totalContent.totalItems}`);

    } catch (err) {
        console.error('Error checking PB:', err);
    }
}

checkFacebookData();
