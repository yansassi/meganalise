const PocketBase = require('pocketbase/cjs');

const PB_URL = 'https://auth.meganalise.pro';
const ADMIN_EMAIL = 'yankingparts@gmail.com';
const ADMIN_PASS = '@YFS23aea06nrs';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const COLLECTIONS = [
    { name: 'instagram_daily_metrics', keys: ['date', 'metric', 'country', 'platform'] },
    { name: 'facebook_daily_metrics', keys: ['date', 'metric', 'country', 'platform'] },
    { name: 'tiktok_daily_metrics', keys: ['date', 'metric', 'country', 'platform'] }
];

const run = async () => {
    console.log(`Connecting to ${PB_URL}...`);
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('Logged in as admin.');
    } catch (e) {
        console.error('Login failed:', e.message);
        process.exit(1);
    }

    console.log('Starting deduplication and indexing...');

    for (const conf of COLLECTIONS) {
        console.log(`\nProcessing ${conf.name}...`);

        try {
            // 1. Fetch all records (batching handled by fullList)
            const records = await pb.collection(conf.name).getFullList({ sort: '-created' });
            console.log(`Fetched ${records.length} records.`);

            // 2. Find duplicates
            const seen = new Set();
            const toDelete = [];

            for (const record of records) {
                // Construct unique key
                // Use substring(0,10) for date to ensure consistency
                const dateKey = record.date.substring(0, 10);
                const platform = record.platform || '';
                const country = record.country || '';
                const metric = record.metric || '';

                // Key format: YYYY-MM-DD_metric_country_platform
                const uniqueKey = `${dateKey}_${metric.toLowerCase()}_${country.toLowerCase()}_${platform.toLowerCase()}`;

                if (seen.has(uniqueKey)) {
                    toDelete.push(record.id);
                } else {
                    seen.add(uniqueKey);
                }
            }

            console.log(`Found ${toDelete.length} duplicates to delete.`);

            // 3. Delete duplicates
            const BATCH_SIZE = 100;
            for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
                const chunk = toDelete.slice(i, i + BATCH_SIZE);
                await Promise.all(chunk.map(id => pb.collection(conf.name).delete(id)));
                process.stdout.write(`.`);
            }
            if (toDelete.length > 0) console.log(' Done deleting.');

            // 4. Update schema with Unique Index
            const idxName = `idx_unique_${conf.name}_dmcp`;
            // Note: PocketBase index names are usually auto-managed if created via UI, but user defined are fine.
            const idxSql = `CREATE UNIQUE INDEX \`${idxName}\` ON \`${conf.name}\` (\`date\`, \`metric\`, \`country\`, \`platform\`)`;

            try {
                // Fetch current collection
                const collection = await pb.collections.getOne(conf.name);
                let indexes = collection.indexes || [];

                // Check if already exists
                if (!indexes.includes(idxSql) && !indexes.some(i => i.includes(idxName))) {
                    console.log(`Adding unique index: ${idxName}`);
                    indexes.push(idxSql);
                    await pb.collections.update(collection.id, { indexes });
                    console.log('Index added successfully.');
                } else {
                    console.log('Index already exists.');
                }
            } catch (err) {
                console.error(`Failed to update schema for ${conf.name}:`, err.message);
            }

        } catch (err) {
            console.error(`Error processing ${conf.name}:`, err);
        }
    }
    console.log('\nDone.');
};

run();
