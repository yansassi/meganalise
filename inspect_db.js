process.env.PB_URL = 'https://auth.meganalise.pro';
const { pb } = require('./server/services/db');

(async () => {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');

        console.log('Fetching instagram_content...');
        const records = await pb.collection('instagram_content').getFullList({
            sort: '-date',
            requestKey: null
        });

        console.log(`Found ${records.length} records.`);

        const typeCounts = {};
        const networkCounts = {};

        // Log first 3 items to see structure
        if (records.length > 0) {
            console.log('First Item:', JSON.stringify(records[0], null, 2));
        }

        records.forEach(r => {
            const pType = r.platform_type || 'undefined';
            typeCounts[pType] = (typeCounts[pType] || 0) + 1;

            const net = r.social_network || 'undefined';
            networkCounts[net] = (networkCounts[net] || 0) + 1;
        });

        console.log('Platform Type Breakdown:', typeCounts);
        console.log('Social Network Breakdown:', networkCounts);

    } catch (err) {
        console.error('Error:', err);
    }
})();
