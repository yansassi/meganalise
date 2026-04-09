const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function migrateData() {
    try {
        console.log('Authenticating...');
        const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: EMAIL, password: PASS })
        });
        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(`Auth failed: ${JSON.stringify(authData)}`);
        const token = authData.token;
        console.log('Authenticated!');

        // 1. Migrate facebook_daily_metrics dates
        console.log('\n--- Migrating facebook_daily_metrics ---');
        const metricsRes = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=500`, {
            headers: { 'Authorization': token }
        });
        const metricsData = await metricsRes.json();
        console.log(`Found ${metricsData.totalItems} records.`);

        for (const record of metricsData.items) {
            if (record.date && record.date.length === 10) { // YYYY-MM-DD
                const newDate = new Date(record.date + 'T12:00:00.000Z').toISOString();
                console.log(`Updating record ${record.id}: ${record.date} -> ${newDate}`);
                await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records/${record.id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ date: newDate })
                });
            }
        }

        // 2. Fix facebook_content (platform and missing fields)
        console.log('\n--- Migrating facebook_content ---');
        const contentRes = await fetch(`${PB_URL}/api/collections/facebook_content/records?perPage=500`, {
            headers: { 'Authorization': token }
        });
        const contentData = await contentRes.json();
        console.log(`Found ${contentData.totalItems} records.`);

        for (const record of contentData.items) {
            let updates = {};
            if (!record.platform || record.platform === "") {
                updates.platform = 'social';
            }
            if (!record.social_network || record.social_network === "") {
                updates.social_network = 'facebook';
            }
            
            if (Object.keys(updates).length > 0) {
                console.log(`Updating content ${record.id}:`, updates);
                await fetch(`${PB_URL}/api/collections/facebook_content/records/${record.id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });
            }
        }

        console.log('\nMigration completed!');

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

migrateData();
