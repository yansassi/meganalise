/**
 * Diagnóstico - Contagem de Métricas por Tipo
 * Execute no console em https://auth.meganalise.pro/_/
 */
const POCKETBASE_URL = 'https://auth.meganalise.pro';

async function countMetrics() {
    console.log('📊 Contando métricas por tipo...');

    try {
        // Pega todos os registros (limite alto)
        const allRecords = await fetch(`${POCKETBASE_URL}/api/collections/instagram_daily_metrics/records?perPage=500&sort=-created`, {
            credentials: 'include'
        }).then(r => r.json());

        const counts = {};
        allRecords.items.forEach(item => {
            counts[item.metric] = (counts[item.metric] || 0) + 1;
        });

        console.table(counts);

        if (Object.keys(counts).length === 0) {
            console.log('❌ Nenhuma métrica encontrada.');
        } else {
            console.log('✅ Métricas encontradas com seus nomes exatos.');
        }

    } catch (err) {
        console.error('Erro:', err);
    }
}

countMetrics();
