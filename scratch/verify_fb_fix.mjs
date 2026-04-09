const API_URL = 'https://api.meganalise.pro';

async function verify() {
    try {
        console.log('Fetching Facebook dashboard data for Brazil...');
        // Emulating a request for last 3 months to be sure to catch migrated data
        const res = await fetch(`${API_URL}/api/dashboard/BR/facebook`);
        const data = await res.json();
        
        console.log('Status:', res.status);
        console.log('Metrics found:', data.metrics.length);
        console.log('Content found:', data.content.length);

        if (data.metrics.length > 0) {
            console.log('Sample Metric Header:', data.metrics[0]);
            const totalImpressions = data.metrics
                .filter(m => m.metric === 'impressions')
                .reduce((sum, m) => sum + m.value, 0);
            console.log('Total Impressions (Visualizações):', totalImpressions);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

verify();
