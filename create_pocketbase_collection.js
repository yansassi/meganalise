/**
 * Script para criar a coleção instagram_audience_demographics via API do PocketBase
 * Execute este script no console do navegador enquanto estiver logado no PocketBase Admin
 */

// URL do PocketBase
const POCKETBASE_URL = 'https://auth.meganalise.pro';

// Definição da coleção
const collectionSchema = {
    name: 'instagram_audience_demographics',
    type: 'base',
    schema: [
        {
            name: 'platform',
            type: 'text',
            required: false,
            options: {}
        },
        {
            name: 'import_date',
            type: 'date',
            required: false,
            options: {}
        },
        {
            name: 'category',
            type: 'select',
            required: false,
            options: {
                maxSelect: 1,
                values: ['age_gender', 'cities', 'countries', 'pages']
            }
        },
        {
            name: 'subcategory',
            type: 'text',
            required: false,
            options: {}
        },
        {
            name: 'gender',
            type: 'text',
            required: false,
            options: {}
        },
        {
            name: 'value',
            type: 'number',
            required: false,
            options: {}
        },
        {
            name: 'rank',
            type: 'number',
            required: false,
            options: {}
        }
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: ''
};

// Função para criar a coleção
async function createCollection() {
    try {
        const response = await fetch(`${POCKETBASE_URL}/api/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectionSchema),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Erro ao criar coleção:', error);
            throw new Error(JSON.stringify(error, null, 2));
        }

        const result = await response.json();
        console.log('✅ Coleção criada com sucesso!', result);
        return result;
    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    }
}

// Executar
console.log('Criando coleção instagram_audience_demographics...');
createCollection()
    .then(() => {
        console.log('✅ Pronto! Recarregue a página do PocketBase para ver a nova coleção.');
    })
    .catch(err => {
        console.error('❌ Falhou:', err.message);
    });
