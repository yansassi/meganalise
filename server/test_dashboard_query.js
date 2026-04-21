require('dotenv').config();
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'https://pocketbase.meganalise.pro');

async function test() {
    try {
        const country = 'BR';
        const platform = 'Facebook';
        const startDate = '2026-04-14';
        const endDate = '2026-04-21';

        const start = new Date(startDate).toISOString();
        const endDateObj = new Date(endDate);
        endDateObj.setUTCHours(23, 59, 59, 999);
        const end = endDateObj.toISOString();

        const metricsFilter = `country = "${country}" && platform = "facebook" && date >= "${start}" && date <= "${end}"`;
        const contentFilter = `country = "${country}" && date >= "${start}" && date <= "${end}"`;

        console.log(`Metrics Filter: ${metricsFilter}`);
        
        const [metrics, content] = await Promise.all([
            pb.collection('facebook_daily_metrics').getFullList({ filter: metricsFilter }),
            pb.collection('facebook_content').getFullList({ filter: contentFilter })
        ]);

        console.log(`Found ${metrics.length} metrics`);
        console.log(`Found ${content.length} content items`);

        if (metrics.length > 0) {
            console.log('Sample metrics:', metrics.slice(0, 3).map(m => ({ date: m.date, metric: m.metric, value: m.value })));
        }
    } catch (e) {
        console.error(e.message);
    }
}

test();
