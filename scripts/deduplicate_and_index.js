const { pb } = require('../server/services/db');

const COLLECTIONS = [
    { name: 'instagram_daily_metrics', keys: ['date', 'metric', 'country', 'platform'] },
    { name: 'facebook_daily_metrics', keys: ['date', 'metric', 'country', 'platform'] },
    { name: 'tiktok_daily_metrics', keys: ['date', 'metric', 'country', 'platform'] }
];

const run = async () => {
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
                const platform = record.platform || ''; // specific handling if field missing
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
            // We need to get current collection details first to preserve existing indexes?
            // PocketBase update updates the definition.

            // Note: We need admin auth to update collection schema usually? 
            // The 'pb' from services/db might be using email/pass or superuser? 
            // If it's the app-level client, it might not have rights to change schema.
            // But we will try. If fails, I will ask user to run SQL or use UI.

            // Construct index SQL
            // Create unique index idx_unique_metric on table (date, metric, country, platform)
            const idxName = `idx_unique_${conf.name}_dmcp`;
            const idxSql = `CREATE UNIQUE INDEX \`${idxName}\` ON \`${conf.name}\` (\`date\`, \`metric\`, \`country\`, \`platform\`)`;

            try {
                // Fetch current collection
                const collection = await pb.collections.getOne(conf.name);
                let indexes = collection.indexes || [];

                // Check if already exists
                if (!indexes.includes(idxName)) {
                    console.log(`Adding unique index: ${idxName}`);
                    indexes.push(idxSql);
                    await pb.collections.update(collection.id, { indexes });
                    console.log('Index added successfully.');
                } else {
                    console.log('Index already exists.');
                }
            } catch (err) {
                console.error(`Failed to update schema for ${conf.name}:`, err.message);
                console.log('You may need to add the index manually in PocketBase UI > Settings > Indexes');
                console.log(`SQL: ${idxSql}`);
            }

        } catch (err) {
            console.error(`Error processing ${conf.name}:`, err);
        }
    }
    console.log('\nDone.');
};

run();
