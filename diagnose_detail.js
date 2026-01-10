/**
 * Diagnóstico Detalhado - Verificar datas e valores salvos.
 * Execute no console em https://auth.meganalise.pro/_/
 */
const POCKETBASE_URL = 'https://auth.meganalise.pro';

async function checkMetricsData() {
    console.log('🕵️‍♀️ Verificando dados salvos...');

    try {
        // Buscar todos os registros ordenados por data (do mais recente para o mais antigo)
        const response = await fetch(`${POCKETBASE_URL}/api/collections/instagram_daily_metrics/records?perPage=50&sort=-date`, { // Changed sort to -date to see relevance
            credentials: 'include'
        });

        const result = await response.json();

        if (result.items.length === 0) {
            console.log('❌ O banco de dados continua VAZIO para métricas diárias.');
            console.log('Isso indica que o parser não conseguiu ler o arquivo ou o upload falhou silenciosamente.');
            return;
        }

        console.log(`✅ Encontrados ${result.items.length} registros.`);
        console.table(result.items.map(i => ({
            id: i.id,
            DB_Date: i.date, // Data exata como está no banco
            Metric: i.metric,
            Value: i.value,
            Platform: i.platform,
            Country: i.country,
            Created: i.created
        })));

    } catch (err) {
        console.error('Erro:', err);
    }
}

checkMetricsData();
