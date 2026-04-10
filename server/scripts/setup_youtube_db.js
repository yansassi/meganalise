/**
 * setup_youtube_db.js
 * 
 * Este script configura o banco de dados PocketBase para a integração do YouTube.
 * Pode ser executado via Node.js (necessita PB_ADMIN_EMAIL e PB_ADMIN_PASSWORD no .env)
 * OU copiado e colado no console do navegador em: https://auth.meganalise.pro/_/
 */

const POCKETBASE_URL = 'https://auth.meganalise.pro';

const collections = [
    {
        name: 'youtube_daily_metrics',
        type: 'base',
        schema: [
            { name: 'date', type: 'date', required: true },
            { name: 'metric', type: 'text', required: true },
            { name: 'value', type: 'number' },
            { name: 'platform', type: 'text' },
            { name: 'country', type: 'text' }
        ],
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: null,
    },
    {
        name: 'youtube_content',
        type: 'base',
        schema: [
            { name: 'original_id', type: 'text', required: true },
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
            { name: 'country', type: 'text' },
            { name: 'image_file', type: 'file', options: { maxSize: 5242880, mimeTypes: ['image/jpg', 'image/jpeg', 'image/png'] } }
        ],
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: null,
    }
];

// Lógica de execução dependente do ambiente
if (typeof window !== 'undefined') {
    // Execução no Navegador
    console.log('🚀 Iniciando atualização via Console...');
    runInBrowser();
} else {
    // Execução via Node.js
    console.log('🖥️ Iniciando atualização via Node.js...');
    runInNode();
}

async function runInBrowser() {
    for (const coll of collections) {
        try {
            console.log(`⏳ Configurando coleção: ${coll.name}...`);
            const res = await fetch(`${POCKETBASE_URL}/api/collections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(coll),
                credentials: 'include'
            });

            if (res.ok) {
                console.log(`✅ Coleção ${coll.name} criada com sucesso!`);
            } else {
                const err = await res.json();
                if (err.message?.includes('already exists') || err.data?.name?.code === 'validation_not_unique') {
                    console.log(`ℹ️ Coleção ${coll.name} já existe. Tentando atualizar...`);
                    const patchRes = await fetch(`${POCKETBASE_URL}/api/collections/${coll.name}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ schema: coll.schema, listRule: coll.listRule, viewRule: coll.viewRule, createRule: coll.createRule, updateRule: coll.updateRule }),
                        credentials: 'include'
                    });
                    if (patchRes.ok) console.log(`✅ Coleção ${coll.name} atualizada!`);
                    else console.error(`❌ Erro ao atualizar ${coll.name}:`, await patchRes.json());
                } else {
                    console.error(`❌ Erro ao criar ${coll.name}:`, err);
                }
            }
        } catch (e) {
            console.error(`❌ Falha crítica em ${coll.name}:`, e.message);
        }
    }
}

async function runInNode() {
    try {
        const PocketBase = require('pocketbase/cjs');
        require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
        
        const pb = new PocketBase(POCKETBASE_URL);

        if (!process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) {
            console.error('❌ Erro: PB_ADMIN_EMAIL ou PB_ADMIN_PASSWORD não encontrados no .env');
            console.log('👉 Por favor, forneça as credenciais ou execute o script no navegador.');
            return;
        }

        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
        console.log('🔓 Autenticado como Admin!');

        for (const coll of collections) {
            try {
                await pb.collections.create(coll);
                console.log(`✅ Coleção ${coll.name} criada.`);
            } catch (err) {
                if (err.status === 400) {
                    console.log(`ℹ️ Coleção ${coll.name} já existe. Atualizando...`);
                    const existing = await pb.collections.getOne(coll.name);
                    await pb.collections.update(existing.id, coll);
                    console.log(`✅ Coleção ${coll.name} atualizada.`);
                } else {
                    console.error(`❌ Erro em ${coll.name}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error('❌ Erro fatal no Node.js:', err.message);
    }
}
