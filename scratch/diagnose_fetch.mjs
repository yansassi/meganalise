const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function diagnose() {
    try {
        console.log('Authenticating...');
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: EMAIL, password: PASS })
        });
        const authData = await authRes.json();
        
        if (!authRes.ok) throw new Error(`Auth failed: ${JSON.stringify(authData)}`);
        const token = authData.token;
        console.log('Authenticated!');

        const collections = ['facebook_daily_metrics', 'facebook_content', 'instagram_daily_metrics'];
        
        for (const coll of collections) {
            console.log(`\n--- ${coll} ---`);
            const recordsRes = await fetch(`${PB_URL}/api/collections/${coll}/records?perPage=5&sort=-created`, {
                headers: { 'Authorization': token }
            });
            const data = await recordsRes.json();
            console.log(`Units: ${data.totalItems}`);
            if (data.items && data.items.length > 0) {
                console.log('Latest records:');
                data.items.forEach(i => {
                    console.log(`- Date: ${i.date}, Metric: ${i.metric}, Value: ${i.value}, Platform: ${i.platform}, Country: ${i.country}`);
                });
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

diagnose();
