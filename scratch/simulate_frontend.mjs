// Simula o que o Frontend faz: chama a API com os últimos 90 dias
const API_URL = 'https://api.meganalise.pro';

async function simulateFrontend() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);

    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());

    const url = `${API_URL}/api/dashboard/BR/facebook?${params.toString()}`;
    console.log('Calling URL:', url);

    const res = await fetch(url);
    const data = await res.json();

    console.log('Status:', res.status);
    console.log('Metrics count:', data.metrics?.length);
    console.log('Content count:', data.content?.length);

    if (data.metrics?.length > 0) {
        // Simula o processDbData do PlatformView
        let reach = 0, interactions = 0, followers = 0, impressions = 0;
        const followersData = [];

        data.metrics.forEach(m => {
            if (m.metric === 'reach') reach += m.value;
            if (m.metric === 'impressions') impressions += m.value;
            if (m.metric === 'interactions') interactions += m.value;
            if (m.metric === 'followers_total') {
                followersData.push({ date: m.date, value: m.value });
            }
        });

        followersData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const netFollowers = followersData.length >= 2 
            ? followersData[followersData.length-1].value - followersData[0].value 
            : 0;

        console.log('\n--- Computed Values ---');
        console.log('Total Reach:', reach);
        console.log('Total Impressions (Visualizações):', impressions);
        console.log('Total Interactions:', interactions);
        console.log('Net Followers:', netFollowers);
        console.log('Followers data points:', followersData.length);
        
        // Unique metric types
        const metricTypes = {};
        data.metrics.forEach(m => { metricTypes[m.metric] = (metricTypes[m.metric] || 0) + 1; });
        console.log('\nMetric types received:', JSON.stringify(metricTypes));
    }
}

simulateFrontend().catch(console.error);
