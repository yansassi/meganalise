const { pb } = require('./server/services/db');

(async () => {
    try {
        console.log('Fetching VIDEO content...');
        const records = await pb.collection('instagram_content').getFullList({
            filter: 'platform_type = "video" || platform_type = "reel"',
            sort: '-date',
            requestKey: null
        });

        console.log(`Total VIDEO/REEL records found: ${records.length}`);

        if (records.length > 0) {
            console.log('First 5 records:');
            records.slice(0, 5).forEach(r => {
                console.log(`- [${r.date}] ${r.title} (Type: ${r.platform_type}, Country: ${r.country})`);
            });

            console.log('Last 5 records:');
            records.slice(-5).forEach(r => {
                console.log(`- [${r.date}] ${r.title} (Type: ${r.platform_type}, Country: ${r.country})`);
            });
        }

    } catch (e) {
        console.error(e);
    }
})();
