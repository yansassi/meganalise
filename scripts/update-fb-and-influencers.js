/**
 * Script para atualizar a coleção facebook_content e criar influencers no PocketBase.
 */

const PB_URL = 'https://auth.meganalise.pro';
const ADMIN_EMAIL = 'yankingparts@gmail.com';
const ADMIN_PASSWORD = '@YFS23aea06nrs';

async function main() {
    console.log('🚀 Iniciando atualização de Meta Ads e Influenciadores...\n');

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

    // 2. Criar coleção Influencers se não existir
    console.log('👥 Verificando coleção "influencers"...');
    const collectionsRes = await fetch(`${PB_URL}/api/collections?perPage=200`, { headers });
    const { items: collections } = await collectionsRes.json();
    
    let influencersCol = collections.find(c => c.name === 'influencers');
    if (!influencersCol) {
        console.log('✨ Criando coleção "influencers"...');
        const createRes = await fetch(`${PB_URL}/api/collections`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'influencers',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'handle', type: 'text', required: true }
                ],
                listRule: '',
                viewRule: '',
                createRule: '',
                updateRule: '',
                deleteRule: ''
            })
        });
        if (createRes.ok) {
            console.log('✅ Coleção "influencers" criada!');
        } else {
            console.error('❌ Erro ao criar influencers:', await createRes.text());
        }
    } else {
        console.log('✅ Coleção "influencers" já existe.');
    }

    // 3. Atualizar facebook_content
    const fbCol = collections.find(c => c.name === 'facebook_content');
    if (fbCol) {
        console.log('🔧 Atualizando "facebook_content"...');
        const fbFields = [
            { name: 'platform_type', type: 'text' },
            { name: 'image_file', type: 'file', options: { maxSelect: 1, maxSize: 5242880 } },
            { name: 'image_url', type: 'text' }
        ];

        let currentFields = fbCol.fields || fbCol.schema || []; // schema for older versions, fields for newer
        const newFields = [...currentFields];

        for (const field of fbFields) {
            if (!newFields.some(f => f.name === field.name)) {
                newFields.push(field);
            }
        }

        const updateRes = await fetch(`${PB_URL}/api/collections/${fbCol.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields: newFields })
        });

        if (updateRes.ok) {
            console.log('✅ "facebook_content" atualizada!');
        } else {
            console.error('❌ Erro ao atualizar facebook_content:', await updateRes.text());
        }
    } else {
        console.warn('⚠️  Coleção "facebook_content" não encontrada.');
    }

    console.log('\n🎉 Configuração do banco concluída!');
}

main().catch(console.error);
