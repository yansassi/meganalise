const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function debugFacebookSchema() {
    try {
        console.log('Checking Facebook Audience Demographics Schema...');
        
        // Tentamos pegar um item qualquer ou ver a estrutura se possível
        // Como o getList deu 400, provavelmente o filtro está errado ou a coleção é diferente
        
        // Vamos tentar sem filtro nenhum
        try {
            const res = await pb.collection('facebook_audience_demographics').getList(1, 1);
            console.log('Query without filter successful:', res.totalItems, 'items');
        } catch (err) {
            console.log('Query without filter FAILED:', err.message);
        }
        
    } catch (err) {
        console.error('Error:', err);
    }
}

debugFacebookSchema();
