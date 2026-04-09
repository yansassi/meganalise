const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function debugData() {
    try {
        console.log('Authenticating...');
        const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: EMAIL, password: PASS })
        });
        const authData = await authRes.json();
        const token = authData.token;

        console.log('\n--- Checking facebook_daily_metrics (first 10) ---');
        const res = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=10&sort=-created`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        data.items.forEach(i => {
            console.log(`ID: ${i.id}, Date: ${i.date}, Metric: ${i.metric}, Value: ${i.value}`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

debugData();
