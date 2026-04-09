const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('https://auth.meganalise.pro');

async function fixPermissions() {
    try {
        console.log('Authenticating as Admin...');
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        console.log('Authenticated!');

        const collections = [
            'facebook_daily_metrics',
            'facebook_content',
            'facebook_audience_demographics'
        ];

        for (const name of collections) {
            try {
                console.log(`Updating rules for ${name}...`);
                const collection = await pb.collections.getOne(name);

                await pb.collections.update(name, {
                    listRule: "", // Public read
                    viewRule: "", // Public read
                    createRule: "", // Public create (for server scripts if not auth as admin, though they should be)
                    updateRule: "", // Public update
                    deleteRule: null, // Admin only delete
                });
                console.log(`Successfully updated rules for ${name}`);
            } catch (err) {
                if (err.status === 404) {
                    console.log(`Collection ${name} not found. skipping.`);
                } else {
                    console.error(`Error updating ${name}:`, err.message);
                }
            }
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

fixPermissions();
