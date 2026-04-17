const PocketBase = require('pocketbase/cjs');

async function run() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    
    try {
        console.log('🔐 Autenticando...');
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        console.log('✅ Autenticado com sucesso!');

        const collectionsToEnsure = [
            {
                name: 'influencers',
                fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'handle', type: 'text', required: true }
                ]
            },
            {
                name: 'instagram_content',
                fields: [
                    { name: 'social_network', type: 'text' },
                    { name: 'views', type: 'number' },
                    { name: 'reach', type: 'number' },
                    { name: 'likes', type: 'number' },
                    { name: 'comments', type: 'number' },
                    { name: 'shares', type: 'number' }
                ]
            },
            {
                name: 'tiktok_content',
                fields: [
                    { name: 'social_network', type: 'text' },
                    { name: 'views', type: 'number' },
                    { name: 'reach', type: 'number' },
                    { name: 'likes', type: 'number' },
                    { name: 'comments', type: 'number' },
                    { name: 'shares', type: 'number' }
                ]
            },
            {
                name: 'facebook_content',
                fields: [
                    { name: 'social_network', type: 'text' },
                    { name: 'views', type: 'number' },
                    { name: 'reach', type: 'number' },
                    { name: 'likes', type: 'number' },
                    { name: 'comments', type: 'number' },
                    { name: 'shares', type: 'number' }
                ]
            },
            {
                name: 'youtube_content',
                fields: [
                    { name: 'social_network', type: 'text' },
                    { name: 'views', type: 'number' },
                    { name: 'reach', type: 'number' },
                    { name: 'likes', type: 'number' },
                    { name: 'comments', type: 'number' },
                    { name: 'shares', type: 'number' }
                ]
            }
        ];

        for (const config of collectionsToEnsure) {
            console.log(`\n📦 Verificando: ${config.name}`);
            try {
                let collection;
                try {
                    collection = await pb.collections.getOne(config.name);
                } catch (err) {
                    if (err.status === 404) {
                        console.log(`  ➕ Criando coleção ${config.name}...`);
                        await pb.collections.create({
                            name: config.name,
                            type: 'base',
                            fields: config.fields,
                            listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
                        });
                        console.log(`  ✅ Criada!`);
                        continue;
                    }
                    throw err;
                }

                // Detectar se usa 'fields' (PB 0.23+) ou 'schema' (PB < 0.23)
                const existingFields = collection.fields || collection.schema || [];
                let newFields = [...existingFields];
                let changed = false;

                for (const field of config.fields) {
                    if (!existingFields.find(f => f.name === field.name)) {
                        console.log(`  🔹 Adicionando campo: ${field.name}`);
                        newFields.push(field);
                        changed = true;
                    }
                }

                const body = {
                    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
                };
                
                if (collection.fields) {
                    body.fields = newFields;
                } else if (collection.schema) {
                    body.schema = newFields;
                }

                // Sempre atualiza as regras para garantir acesso público
                console.log(`  🆙 Atualizando coleção e regras...`);
                await pb.collections.update(collection.id, body);
                console.log(`  ✅ Atualizada!`);

            } catch (err) {
                console.error(`  ❌ Erro em ${config.name}:`, err.message);
                // Log the object if needed to debug
                // console.log(err);
            }
        }

        console.log('\n✨ Restauração completa!');
    } catch (err) {
        console.error('❌ Erro fatal de autenticação:', err.message);
    }
}

run();
