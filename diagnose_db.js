/**
 * Script de Diagnóstico - Investigar o que está salvo no banco de dados.
 * Execute no console do navegador em https://auth.meganalise.pro/_/
 */
const POCKETBASE_URL = 'https://auth.meganalise.pro';

async function diagnoseMetrics() {
    console.log('🕵️‍♀️ Iniciando diagnóstico...');

    try {
        // 1. Buscar os últimos 10 registros de métricas (sem filtro de erro)
        const metrics = await fetch(`${POCKETBASE_URL}/api/collections/instagram_daily_metrics/records?perPage=10&sort=-created`, {
            credentials: 'include'
        }).then(r => r.json());

        console.log('📊 Últimos 10 registros na tabela instagram_daily_metrics:');
        if (metrics.items && metrics.items.length > 0) {
            console.table(metrics.items.map(i => ({
                id: i.id,
                date: i.date, // Data do registro
                metric: i.metric, // Nome da métrica
                value: i.value, // Valor
                platform: i.platform || 'MISSING', // Se tiver vazio avisa
                country: i.country
            })));
        } else {
            console.log('⚠️ A tabela parece estar VAZIA!');
        }

    } catch (err) {
        console.error('❌ Erro ao ler banco:', err);
    }
}

diagnoseMetrics();
