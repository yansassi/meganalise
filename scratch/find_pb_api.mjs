const PB_URL = 'https://auth.meganalise.pro';

async function findApi() {
    try {
        console.log('Fetching root...');
        const res = await fetch(`${PB_URL}`);
        console.log('Status:', res.status);
        console.log('Headers:', JSON.stringify([...res.headers], null, 2));

        console.log('\nFetching /api/health...');
        const healthRes = await fetch(`${PB_URL}/api/health`);
        console.log('Health Status:', healthRes.status);
        if (healthRes.ok) {
            console.log('Health Data:', await healthRes.json());
        }

        console.log('\nFetching /api/settings...');
        const settingsRes = await fetch(`${PB_URL}/api/settings`);
        console.log('Settings Status:', settingsRes.status);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

findApi();
