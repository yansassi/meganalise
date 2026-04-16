/**
 * Script para atualizar o schema do PocketBase via API Admin
 * Adiciona o campo `platforms` na coleção `evidence_registries`
 * e inspeciona o schema de youtube_content
 *
 * Uso: node scripts/update-pb-schema.js
 */

const PB_URL = 'https://auth.meganalise.pro';
const ADMIN_EMAIL = 'yankingparts@gmail.com';
const ADMIN_PASSWORD = '@YFS23aea06nrs';

async function main() {
    console.log('🚀 Iniciando atualização do schema do PocketBase...\n');

    // 1. Autenticar como superuser (PocketBase v0.23+)
    console.log('🔐 Autenticando como superuser...');
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!authRes.ok) {
        const err = await authRes.text();
        throw new Error(`Falha na autenticação: ${err}`);
    }

    const authData = await authRes.json();
    const token = authData.token;
    console.log('✅ Autenticado com sucesso!\n');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Buscar todas as coleções
    console.log('📋 Buscando lista de coleções...');
    const collectionsRes = await fetch(`${PB_URL}/api/collections?perPage=200`, { headers });
    const collectionsData = await collectionsRes.json();
    const collections = collectionsData.items || [];
    console.log(`   Encontradas ${collections.length} coleções.\n`);

    // 3. Resumo das coleções relevantes
    const relevantCols = [
        'evidence_registries', 'instagram_content', 'tiktok_content',
        'facebook_content', 'youtube_content', 'youtube_daily_metrics',
        'instagram_daily_metrics', 'tiktok_daily_metrics', 'facebook_daily_metrics',
        'facebook_daily_metrics_', 'facebook_audience_data', 'instagram_audience_data',
        'tiktok_audience_data'
    ];
    console.log('📊 Coleções encontradas:');
    relevantCols.forEach(name => {
        const col = collections.find(c => c.name === name);
        if (col) {
            console.log(`   ✅ ${name} (${col.schema?.length || 0} campos no schema)`);
        } else {
            console.log(`   ❌ ${name} — NÃO ENCONTRADA`);
        }
    });
    console.log('');

    // 4. Atualizar evidence_registries — adicionar campo "platforms"
    const evidenceCol = collections.find(c => c.name === 'evidence_registries');
    if (!evidenceCol) {
        console.error('❌ Coleção evidence_registries não encontrada!');
        process.exit(1);
    }

    const schema = evidenceCol.schema || evidenceCol.fields || [];
    const hasPlatforms = schema.some(f => f.name === 'platforms');

    if (hasPlatforms) {
        console.log('ℹ️  Campo "platforms" já existe em evidence_registries. Pulando...\n');
    } else {
        console.log('➕ Adicionando campo "platforms" em evidence_registries...');
        const newSchema = [
            ...schema,
            {
                name: 'platforms',
                type: 'text',
                required: false,
                options: { min: null, max: null, pattern: '' }
            }
        ];

        const updateRes = await fetch(`${PB_URL}/api/collections/${evidenceCol.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ schema: newSchema })
        });

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            // Tenta com "fields" (PB v0.23+)
            console.log('   Tentando com formato fields (PB v0.23+)...');
            const updateRes2 = await fetch(`${PB_URL}/api/collections/${evidenceCol.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    fields: [
                        ...schema,
                        {
                            name: 'platforms',
                            type: 'text',
                            required: false
                        }
                    ]
                })
            });
            if (!updateRes2.ok) {
                const err2 = await updateRes2.text();
                throw new Error(`Falha ao atualizar: ${errText} / ${err2}`);
            }
        }
        console.log('✅ Campo "platforms" adicionado com sucesso!\n');
    }

    // 5. Inspecionar youtube_content via registro real
    const ytCol = collections.find(c => c.name === 'youtube_content');
    if (ytCol) {
        console.log('🎬 Inspecionando youtube_content...');
        const recordRes = await fetch(`${PB_URL}/api/collections/youtube_content/records?perPage=1`, { headers });
        const recordData = await recordRes.json();
        const sample = recordData.items?.[0];

        if (sample) {
            const neededFields = [
                'title', 'views', 'likes', 'comments', 'reach', 'impressions',
                'watch_time', 'subscribers', 'ctr', 'duration', 'permalink',
                'image_url', 'image_file', 'date', 'country', 'platform_type', 'social_network'
            ];
            console.log('\n   🔍 Campos necessários para o dashboard:');
            neededFields.forEach(f => {
                const exists = f in sample;
                const value = sample[f];
                console.log(`   ${exists ? '✅' : '❌'} ${f}${exists ? `: ${JSON.stringify(value)?.slice(0, 40)}` : ''}`);
            });
        } else {
            console.log('   Nenhum registro encontrado para inspeção.');
        }
    }

    console.log('\n🎉 Script finalizado!');
}

main().catch(err => {
    console.error('\n💥 Erro:', err.message);
    process.exit(1);
});
