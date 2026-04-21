
const PocketBase = require('pocketbase/cjs');

async function updateAllAudienceCollections() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const collections = ['pbc_4224708381', 'pbc_595985733', 'pbc_314292201']; // IG, FB, TikTok
        
        for (const id of collections) {
            const collection = await pb.collections.getOne(id);
            console.log(`Checking ${collection.name}...`);
            
            const currentFields = collection.fields || [];
            let changed = false;

            if (!currentFields.find(f => f.name === 'followers_history_data')) {
                currentFields.push({ name: 'followers_history_data', type: 'json' });
                changed = true;
            }
            if (!currentFields.find(f => f.name === 'similar_pages_data')) {
                currentFields.push({ name: 'similar_pages_data', type: 'json' });
                changed = true;
            }

            if (changed) {
                await pb.collections.update(id, { fields: currentFields });
                console.log(`Updated ${collection.name}`);
            } else {
                console.log(`${collection.name} already has the fields.`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
updateAllAudienceCollections();
