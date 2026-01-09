/**
 * Script for updating the instagram_content collection to include 'social_network' field.
 * Run this in your browser console while logged into https://auth.meganalise.pro/_/
 */
const POCKETBASE_URL = 'https://auth.meganalise.pro';

async function updateCollection() {
    console.log('🔄 Checking instagram_content schema...');
    try {
        // 1. Fetch current collection schema
        const response = await fetch(`${POCKETBASE_URL}/api/collections/instagram_content`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch collection (Are you logged in?)');
        const collection = await response.json();

        // 2. Check if field exists
        const fieldExists = collection.schema.some(f => f.name === 'social_network');
        if (fieldExists) {
            console.log('✅ Field "social_network" already exists. No action needed.');
            return;
        }

        console.log('➕ Adding "social_network" field...');

        // 3. Add field
        collection.schema.push({
            name: 'social_network',
            type: 'text',
            required: false,
            options: {}
        });

        // 4. Update collection
        const updateRes = await fetch(`${POCKETBASE_URL}/api/collections/instagram_content`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schema: collection.schema }),
            credentials: 'include'
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(JSON.stringify(err));
        }

        console.log('✅ Success! Field "social_network" added.');
        console.log('Please refresh your application dashboard.');
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

updateCollection();
