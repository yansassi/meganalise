
const { pb } = require('./services/db');

async function checkFacebookData() {
    try {
        const facebookMetrics = await pb.collection('facebook_daily_metrics').getList(1, 1);
        const facebookContent = await pb.collection('facebook_content').getList(1, 1);
        const facebookDemographics = await pb.collection('facebook_audience_demographics').getList(1, 1);

        console.log('--- Facebook Data Check ---');
        console.log('facebook_daily_metrics total:', facebookMetrics.totalItems);
        console.log('facebook_content total:', facebookContent.totalItems);
        console.log('facebook_audience_demographics total:', facebookDemographics.totalItems);
        
        if (facebookMetrics.totalItems > 0) {
            console.log('Sample Metric Date:', facebookMetrics.items[0].date);
            console.log('Sample Metric Platform:', facebookMetrics.items[0].platform);
            console.log('Sample Metric Country:', facebookMetrics.items[0].country);
        }
        if (facebookContent.totalItems > 0) {
            console.log('Sample Content Date:', facebookContent.items[0].date);
            console.log('Sample Content Country:', facebookContent.items[0].country);
        }

    } catch (err) {
        console.error('Error checking data:', err.message);
    }
}

checkFacebookData();
