const PocketBase = require('pocketbase/cjs');

async function checkMetricsForID(id, country) {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log(`Checking metrics for ID: ${id}, Country: ${country}...`);
        const metrics = await pb.collection('instagram_daily_metrics').getFullList({
            filter: `influencer_id = "${id}" && country = "${country}"`,
        });

        console.log('Total records:', metrics.length);
        if (metrics.length > 0) {
            console.log('Sample date:', metrics[0].date);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

async function run() {
    await checkMetricsForID('wkf7xn194yeodu5', 'PY'); // Xiaomi
    await checkMetricsForID('368dafkd5a3s3av', 'PY'); // Blackview
    await checkMetricsForID('szl6e25zbtubyt4', 'PY'); // Imilab
}

run();
