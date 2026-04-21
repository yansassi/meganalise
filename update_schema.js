
const PocketBase = require('pocketbase/cjs');

async function updateSchema() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        const collection = await pb.collections.getOne('pbc_4224708381');
        
        console.log('Collection:', collection.name);
        
        const newFields = [
            {
                name: 'followers_history_data',
                type: 'json',
            },
            {
                name: 'similar_pages_data',
                type: 'json',
            }
        ];

        let schemaUpdated = false;
        // In some PB versions, schema is inside 'fields' or just 'schema'
        const fields = collection.schema || collection.fields || [];

        newFields.forEach(nf => {
            if (!fields.find(f => f.name === nf.name)) {
                fields.push({
                    name: nf.name,
                    type: nf.type,
                    required: false,
                    presentable: false,
                    unique: false,
                    options: {}
                });
                schemaUpdated = true;
                console.log(`Added ${nf.name}`);
            }
        });

        if (schemaUpdated) {
            await pb.collections.update('pbc_4224708381', {
                schema: fields
            });
            console.log('Done!');
        } else {
            console.log('No changes.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
updateSchema();
