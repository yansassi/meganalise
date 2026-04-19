const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function checkCollections() {
    try {
        console.log('Checking for audience collections...');
        
        // Tentamos listar as coleções via API de conteúdo (se as regras permitirem)
        // Ou tentamos apenas fazer um getList em cada uma
        
        const collections = [
            'instagram_audience_demographics',
            'facebook_audience_demographics',
            'tiktok_audience_demographics'
        ];
        
        for (const coll of collections) {
            try {
                const res = await pb.collection(coll).getList(1, 1);
                console.log(`Collection ${coll}: EXISTS and accessible (${res.totalItems} items)`);
            } catch (err) {
                console.log(`Collection ${coll}: ERROR or MISSING (${err.message})`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkCollections();
