const PocketBase = require('pocketbase/cjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const pb = new PocketBase('https://auth.meganalise.pro');

async function fixFacebookAudienceSchema() {
    try {
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
        console.log('Authenticated as admin.');

        const name = 'facebook_audience_demographics';
        const collection = await pb.collections.getOne(name);
        
        const existingFields = collection.fields || collection.schema || [];
        const existingNames = existingFields.map(f => f.name);
        
        console.log(`Current fields for ${name}:`, existingNames.join(', '));
        
        if (!existingNames.includes('country')) {
            console.log('Adding missing "country" field...');
            const newFields = [...existingFields, { name: 'country', type: 'text' }];
            await pb.collections.update(name, { fields: newFields });
            console.log('✅ Field "country" added successfully!');
        } else {
            console.log('Field "country" already exists.');
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

fixFacebookAudienceSchema();
