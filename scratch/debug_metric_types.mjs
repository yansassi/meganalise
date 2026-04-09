const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function debugMetrics() {
    try {
        console.log('Authenticating...');
        const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: EMAIL, password: PASS })
        });
        const authData = await authRes.json();
        const token = authData.token;

        // Checar quais tipos de métricas existem
        console.log('\n--- Metric Types in facebook_daily_metrics ---');
        const res1 = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=500&sort=metric`, {
            headers: { 'Authorization': token }
        });
        const data1 = await res1.json();
        
        const metricTypes = {};
        data1.items.forEach(i => {
            metricTypes[i.metric] = (metricTypes[i.metric] || 0) + 1;
        });
        console.log('Metric types:', JSON.stringify(metricTypes, null, 2));
        console.log('Total:', data1.totalItems);

        // Verificar se há records de 'impressions'
        const impressionRes = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=5&filter=metric%3D%22impressions%22`, {
            headers: { 'Authorization': token }
        });
        const impressionData = await impressionRes.json();
        console.log('\nImpressions records:', impressionData.totalItems);
        if (impressionData.items?.length > 0) {
            console.log('Sample:', JSON.stringify(impressionData.items[0]));
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

debugMetrics();
