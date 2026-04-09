const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function fixEvidencePermissions() {
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

        const collectionName = 'evidence_registries';
        console.log(`\n--- Fetching collection info for: ${collectionName} ---`);
        const getRes = await fetch(`${PB_URL}/api/collections/${collectionName}`, {
            headers: { 'Authorization': token }
        });
        const collection = await getRes.json();

        if (!getRes.ok) {
            console.log(`Collection ${collectionName} not found.`);
            return;
        }

        console.log(`Updating rules for ${collectionName}...`);
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
                deleteRule: "", // Public delete (consistent with current simplicity goal)
            })
        });

        if (updateRes.ok) {
            console.log(`Successfully updated rules for ${collectionName}`);
        } else {
            const errData = await updateRes.json();
            console.error(`Failed to update ${collectionName}: ${updateRes.status} ${JSON.stringify(errData)}`);
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

fixEvidencePermissions();
