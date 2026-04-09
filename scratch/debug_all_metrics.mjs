const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function fullDebug() {
    try {
        const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: EMAIL, password: PASS })
        });
        const token = (await authRes.json()).token;

        // Checar TODOS os registros de métricas
        let page = 1;
        const allMetrics = {};
        while (true) {
            const res = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=500&page=${page}`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            data.items.forEach(i => {
                allMetrics[i.metric] = (allMetrics[i.metric] || 0) + 1;
            });
            if (page * 500 >= data.totalItems) break;
            page++;
        }
        
        console.log('ALL metric types in facebook_daily_metrics:');
        console.log(JSON.stringify(allMetrics, null, 2));
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

fullDebug();
