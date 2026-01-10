/**
 * Script para corrigir métricas antigas que ficaram sem o campo "platform" preenchido.
 * Execute este script no console do navegador em https://auth.meganalise.pro/_/
 */
const POCKETBASE_URL = 'https://auth.meganalise.pro';

async function fixMetricsPlatform() {
    console.log('🔄 Iniciando correção de métricas (platform)...');
    try {
        // Obter todos os registros que não têm platform definido (ou vazio)
        // Nota: PocketBase pode não achar fácil filtrar por vazio/null dependendo da versão,
        // então vamos pegar todos de 'instagram_daily_metrics' e verificar.
        // Se a base for gigante, isso pode ser lento, mas para uso atual deve ser ok.

        // Vamos tentar filtrar por platform vazio se possível
        let filter = 'platform = ""';

        console.log('📥 Buscando registros sem plataforma...');
        const records = await fetch(`${POCKETBASE_URL}/api/collections/instagram_daily_metrics/records?perPage=500&filter=(platform="" || platform=null)`, {
            credentials: 'include'
        }).then(r => r.json());

        if (records.items.length === 0) {
            console.log('✅ Nenhum registro precisando de correção encontrado.');
            return;
        }

        console.log(`🔍 Encontrados ${records.items.length} registros (página 1) para corrigir.`);

        let updatedCount = 0;
        for (const item of records.items) {
            await fetch(`${POCKETBASE_URL}/api/collections/instagram_daily_metrics/records/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: 'instagram' }),
                credentials: 'include'
            });
            updatedCount++;
            if (updatedCount % 10 === 0) console.log(`... corrigidos ${updatedCount}`);
        }

        console.log(`✅ Sucesso! ${updatedCount} registros atualizados.`);
        console.log('Se houver mais páginas, execute o script novamente.');

    } catch (err) {
        console.error('❌ Erro:', err);
    }
}

fixMetricsPlatform();
