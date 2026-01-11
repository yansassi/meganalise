const { pb } = require('./server/services/db');

(async () => {
    try {
        console.log('Fetching record for 11/01/2026...');
        // Date format in DB is ISO string UTC.
        // 11/01/2026 could be 2026-01-11 00:00:00.000Z
        const records = await pb.collection('instagram_content').getFullList({
            filter: 'date >= "2026-01-11 00:00:00"',
            requestKey: null
        });

        console.log(`Found ${records.length} records.`);
        if (records.length > 0) {
            console.log(JSON.stringify(records[0], null, 2));
        }

    } catch (e) {
        console.error(e);
    }
})();
