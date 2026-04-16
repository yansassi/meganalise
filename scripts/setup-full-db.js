/**
 * Script para configurar o schema completo do PocketBase para YouTube e outras redes.
 */

const PB_URL = 'https://auth.meganalise.pro';
const ADMIN_EMAIL = 'yankingparts@gmail.com';
const ADMIN_PASSWORD = '@YFS23aea06nrs';

async function main() {
    console.log('🚀 Iniciando configuração completa do schema...\n');

    // 1. Autenticar
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const { token } = await authRes.json();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Definir Schemas
    const youtubeContentFields = [
        { name: 'title', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'views', type: 'number' },
        { name: 'reach', type: 'number' },
        { name: 'impressions', type: 'number' },
        { name: 'watch_time', type: 'number' },
        { name: 'subscribers', type: 'number' },
        { name: 'ctr', type: 'number' },
        { name: 'duration', type: 'number' },
        { name: 'social_network', type: 'text' },
        { name: 'platform', type: 'text' },
        { name: 'permalink', type: 'text' },
        { name: 'image_url', type: 'text' },
        { name: 'image_file', type: 'file', options: { maxSelect: 1, maxSize: 5242880 } },
        { name: 'country', type: 'text' },
        { name: 'platform_type', type: 'text' }
    ];

    const dailyMetricFields = [
        { name: 'date', type: 'date', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'metric', type: 'text', required: true },
        { name: 'platform', type: 'text', required: true },
        { name: 'country', type: 'text' }
    ];

    const collectionsToUpdate = [
        { name: 'youtube_content', fields: youtubeContentFields },
        { name: 'youtube_daily_metrics', fields: dailyMetricFields },
        { name: 'instagram_daily_metrics', fields: dailyMetricFields },
        { name: 'tiktok_daily_metrics', fields: dailyMetricFields },
        { name: 'facebook_daily_metrics', fields: dailyMetricFields }
    ];

    // 3. Executar updates
    const collectionsRes = await fetch(`${PB_URL}/api/collections?perPage=200`, { headers });
    const { items: collections } = await collectionsRes.json();

    for (const config of collectionsToUpdate) {
        const col = collections.find(c => c.name === config.name);
        if (!col) {
            console.log(`⚠️  Coleção ${config.name} não encontrada.`);
            continue;
        }

        console.log(`🔧 Atualizando ${config.name}...`);
        
        // No PocketBase v0.23+, usamos PATCH no endpoint da coleção
        // Precisamos manter os campos existentes (especialmente o ID)
        const currentFields = col.fields || [];
        const newFields = [...currentFields];

        for (const field of config.fields) {
            if (!newFields.some(f => f.name === field.name)) {
                newFields.push(field);
            }
        }

        const updateRes = await fetch(`${PB_URL}/api/collections/${col.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields: newFields })
        });

        if (updateRes.ok) {
            console.log(`✅ ${config.name} atualizada com sucesso!`);
        } else {
            console.log(`❌ Erro ao atualizar ${config.name}:`, await updateRes.text());
        }
    }

    console.log('\n🎉 Configuração concluída!');
}

main().catch(console.error);
