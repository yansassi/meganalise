const { pb } = require('./server/services/db');

(async () => {
    try {
        console.log('Fetching all content...');
        // allow up to 5000 records
        const records = await pb.collection('instagram_content').getFullList({
            sort: '-date',
            requestKey: null
        });

        console.log(`Total records: ${records.length}`);

        const counts = {};
        const byType = {};

        records.forEach(r => {
            counts[r.platform_type] = (counts[r.platform_type] || 0) + 1;

            if (!byType[r.platform_type]) byType[r.platform_type] = [];
            if (byType[r.platform_type].length < 3) {
                byType[r.platform_type].push({
                    id: r.id,
                    original_id: r.original_id,
                    title: r.title,
                    date: r.date,
                    platform_type: r.platform_type
                });
            }
        });

        console.log('Counts by platform_type:', counts);
        console.log('Samples:', JSON.stringify(byType, null, 2));

    } catch (e) {
        console.error(e);
    }
})();
