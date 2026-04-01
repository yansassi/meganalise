
const https = require('https');

const POCKETBASE_URL = 'auth.meganalise.pro';
const COLLECTION_NAME = 'tiktok_audience_demographics';
const FIELD_NAME = 'import_date';

async function updateCollection() {
    console.log(`🔄 Checking ${COLLECTION_NAME} schema...`);
    try {
        const collection = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: POCKETBASE_URL,
                path: `/api/collections/${COLLECTION_NAME}`,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        return reject(new Error(`HTTP error! status: ${res.statusCode}`));
                    }
                    resolve(JSON.parse(data));
                });
            });
            req.on('error', reject);
            req.end();
        });

        const fieldExists = collection.schema.some(f => f.name === FIELD_NAME);
        if (fieldExists) {
            console.log(`✅ Field "${FIELD_NAME}" already exists. No action needed.`);
            return;
        }

        console.log(`➕ Adding "${FIELD_NAME}" field...`);

        collection.schema.push({
            name: FIELD_NAME,
            type: 'date',
            required: false,
            options: {}
        });

        await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: POCKETBASE_URL,
                path: `/api/collections/${COLLECTION_NAME}`,
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            }, (res) => {
                if (res.statusCode >= 400) {
                    return reject(new Error(`HTTP error! status: ${res.statusCode}`));
                }
                resolve();
            });
            req.on('error', reject);
            req.write(JSON.stringify({ schema: collection.schema }));
            req.end();
        });

        console.log(`✅ Success! Field "${FIELD_NAME}" added.`);
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

updateCollection();
