const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('https://auth.meganalise.pro');

async function runDiagnosis() {
    try {
        console.log('Authenticating...');
        // Using credentials found in inspect_db.js
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        console.log('Authenticated!');

        const collections = ['facebook_daily_metrics', 'facebook_content', 'instagram_daily_metrics', 'instagram_content'];

        for (const coll of collections) {
            console.log(`\n--- Inspecting collection: ${coll} ---`);
            try {
                const total = await pb.collection(coll).getList(1, 1);
                console.log(`Total records: ${total.totalItems}`);
                
                if (total.totalItems > 0) {
                    const sample = total.items[0];
                    console.log('Sample record keys:', Object.keys(sample).join(', '));
                    console.log('Sample data:', JSON.stringify({
                        id: sample.id,
                        date: sample.date,
                        metric: sample.metric,
                        value: sample.value,
                        platform: sample.platform,
                        country: sample.country
                    }, null, 2));
                }
            } catch (e) {
                console.log(`Error or collection ${coll} does not exist: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Core error:', err);
    }
}

runDiagnosis();
