const PocketBase = require('pocketbase/cjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const pb = new PocketBase('https://auth.meganalise.pro');

async function updatePermissions() {
    try {
        console.log('Authenticating as Admin...');
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
        console.log('Authenticated!');

        const collections = [
            'tiktok_content',
            'tiktok_daily_metrics',
            'tiktok_audience_demographics'
        ];

        for (const name of collections) {
            try {
                console.log(`Updating rules for ${name}...`);
                const collection = await pb.collections.getOne(name);

                // Allow public read (or authenticated read) and admin write
                // For this dashboard, we might want public read or at least authenticated.
                // Setting to "" (empty string) allows public access.
                // Setting to "@request.auth.id != ''" allows only authenticated users.

                // Given the error "Only superusers...", it likely has no rules (default is admin only).

                await pb.collections.update(name, {
                    listRule: "", // Public read
                    viewRule: "", // Public read
                    createRule: "", // Public create (or restrict if needed, but for now open for upload script convenience/backend)
                    updateRule: "", // Public update
                    deleteRule: null, // Admin only delete
                });
                console.log(`Updated rules for ${name}`);
            } catch (err) {
                if (err.status === 404) {
                    console.log(`Collection ${name} not found. Creating it...`);
                    // If it doesn't exist, create it with rules
                    await pb.collections.create({
                        name: name,
                        type: 'base',
                        listRule: "",
                        viewRule: "",
                        createRule: "",
                        updateRule: "",
                        schema: [
                            // minimal schema, standard fields are auto
                            { name: 'country', type: 'text' },
                            { name: 'platform', type: 'text' },
                            { name: 'original_id', type: 'text' }
                        ]
                    });
                    console.log(`Created collection ${name}`);
                } else {
                    console.error(`Error updating ${name}:`, err.message);
                }
            }
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

updatePermissions();
