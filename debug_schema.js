
const PocketBase = require('pocketbase/cjs');

async function debugSchema() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        const collection = await pb.collections.getOne('pbc_4224708381');
        
        console.log('--- COLLECTION DEBUG ---');
        console.log('ID:', collection.id);
        console.log('Name:', collection.name);
        console.log('Has schema?:', !!collection.schema);
        console.log('Has fields?:', !!collection.fields);
        
        const currentFields = collection.fields || collection.schema || [];
        console.log('Current Fields:', currentFields.map(f => f.name));

        const newFields = [...currentFields];
        let changed = false;

        if (!newFields.find(f => f.name === 'followers_history_data')) {
            newFields.push({ name: 'followers_history_data', type: 'json' });
            changed = true;
        }
        if (!newFields.find(f => f.name === 'similar_pages_data')) {
            newFields.push({ name: 'similar_pages_data', type: 'json' });
            changed = true;
        }

        if (changed) {
            console.log('Attempting update with fields:', newFields.map(f => f.name));
            // Try both properties just in case
            const updateData = {};
            if (collection.fields) updateData.fields = newFields;
            if (collection.schema) updateData.schema = newFields;
            
            const result = await pb.collections.update(collection.id, updateData);
            console.log('Update result successful. New fields:', (result.fields || result.schema || []).map(f => f.name));
        } else {
            console.log('No changes needed.');
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.response || err);
        process.exit(1);
    }
}
debugSchema();
