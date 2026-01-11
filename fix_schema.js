const PocketBase = require('pocketbase/cjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const pb = new PocketBase('https://auth.meganalise.pro');

const COLLECTIONS = {
    'tiktok_content': [
        { name: 'original_id', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'permalink', type: 'text' },
        { name: 'post_time', type: 'text' },
        { name: 'likes', type: 'number' },
        { name: 'comments', type: 'number' },
        { name: 'shares', type: 'number' },
        { name: 'views', type: 'number' },
        { name: 'country', type: 'text' },
        { name: 'date_published', type: 'date' }
    ],
    'tiktok_daily_metrics': [
        { name: 'date', type: 'date' },
        { name: 'metric', type: 'text' },
        { name: 'value', type: 'number' },
        { name: 'platform', type: 'text' },
        { name: 'country', type: 'text' }
    ],
    'tiktok_audience_demographics': [
        { name: 'type', type: 'text' },
        { name: 'data', type: 'json' },
        { name: 'date_reference', type: 'date' },
        // { name: 'country', type: 'text' } // Adding country for future consistency
    ]
};

async function fixSchema() {
    try {
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
        console.log('Authenticated.');

        for (const [name, fields] of Object.entries(COLLECTIONS)) {
            try {
                const collection = await pb.collections.getOne(name);
                console.log(`Checking schema for ${name}...`);

                const existingFields = collection.fields || collection.schema || [];
                const existingNames = existingFields.map(f => f.name);
                let changes = false;
                const newFields = [...existingFields];

                for (const field of fields) {
                    if (!existingNames.includes(field.name)) {
                        console.log(`Adding missing field: ${field.name} (${field.type}) to ${name}`);
                        newFields.push(field);
                        changes = true;
                    }
                }

                if (changes) {
                    await pb.collections.update(name, { fields: newFields });
                    console.log(`Updated schema for ${name}`);
                } else {
                    console.log(`Schema for ${name} is already correct.`);
                }

            } catch (err) {
                console.error(`Error checking ${name}:`, err.message);
            }
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

fixSchema();
