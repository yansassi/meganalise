const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function debugRegistryItems() {
    try {
        const registryId = 'vqi43rkfkqttm5s';
        console.log(`Debug Registry ${registryId}`);
        
        // Simular o que o dataService faz
        const registry = await pb.collection('evidence_registries').getOne(registryId);
        const keywords = registry.keywords;
        
        const res = await pb.collection('facebook_content').getList(1, 5, {
            filter: `title ~ "lattafa" || permalink ~ "lattafa"`,
        });
        
        console.log(`Found ${res.totalItems} FB items for "lattafa"`);
        res.items.forEach(i => {
            console.log(`Item ID: ${i.id}`);
            console.log(`  Title: ${i.title}`);
            console.log(`  Views: ${i.views}`);
            console.log(`  Reach: ${i.reach}`);
            console.log(`  Impressions: ${i.impressions}`);
            console.log(`  Platform: ${i.platform}`);
            console.log(`  All Keys: ${Object.keys(i).join(', ')}`);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

debugRegistryItems();
