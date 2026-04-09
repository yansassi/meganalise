const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function fixPermissions() {
    try {
        console.log('Authenticating as Admin...');
        const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: EMAIL, password: PASS })
        });
        const authData = await authRes.json();
        
        if (!authRes.ok) throw new Error(`Auth failed: ${JSON.stringify(authData)}`);
        const token = authData.token;
        console.log('Authenticated!');

        const collections = [
            'facebook_daily_metrics',
            'facebook_content',
            'facebook_audience_demographics'
        ];

        for (const name of collections) {
            console.log(`\n--- Fetching collection info for: ${name} ---`);
            const getRes = await fetch(`${PB_URL}/api/collections/${name}`, {
                headers: { 'Authorization': token }
            });
            const collection = await getRes.json();

            if (!getRes.ok) {
                console.log(`Collection ${name} not found or error: ${getRes.status} ${JSON.stringify(collection)}`);
                continue;
            }

            console.log(`Updating rules for ${name}...`);
            const updateRes = await fetch(`${PB_URL}/api/collections/${collection.id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    listRule: "", // Public read
                    viewRule: "", // Public read
                    createRule: "", // Public create
                    updateRule: "", // Public update
                    deleteRule: null, // Admin only delete
                })
            });

            if (updateRes.ok) {
                console.log(`Successfully updated rules for ${name}`);
            } else {
                const errData = await updateRes.json();
                console.error(`Failed to update ${name}: ${updateRes.status} ${JSON.stringify(errData)}`);
            }
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

fixPermissions();
