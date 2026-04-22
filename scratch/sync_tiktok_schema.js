const PocketBase = require('pocketbase/cjs');

async function syncSchema() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    
    try {
        // Authenticate
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        console.log('Authenticated successfully');

        // Helper to sync a collection
        async function syncCollection(collectionName, requiredFields) {
            console.log(`\nSyncing collection: ${collectionName}`);
            const collection = await pb.collections.getOne(collectionName);
            
            // PB v0.23+ uses 'fields' array for schema
            const currentFields = collection.fields || [];
            console.log('Current fields:', currentFields.map(f => f.name).join(', '));

            let fieldsUpdated = false;
            for (const req of requiredFields) {
                if (!currentFields.find(f => f.name === req.name)) {
                    console.log(`Adding missing field '${req.name}'`);
                    currentFields.push({
                        name: req.name,
                        type: req.type,
                        required: false,
                        presentable: false,
                        unique: false,
                        // For v0.23+, some options might be needed depending on type
                        // but usually empty object works for text/number/date
                        options: {}
                    });
                    fieldsUpdated = true;
                }
            }

            if (fieldsUpdated) {
                await pb.collections.update(collection.id, { fields: currentFields });
                console.log(`${collectionName} updated successfully`);
            } else {
                console.log(`${collectionName} is already up to date`);
            }
        }

        await syncCollection('tiktok_content', [
            { name: 'author', type: 'text' },
            { name: 'saved', type: 'number' },
            { name: 'likes', type: 'number' },
            { name: 'comments', type: 'number' },
            { name: 'shares', type: 'number' },
            { name: 'views', type: 'number' },
            { name: 'date', type: 'date' },
            { name: 'title', type: 'text' },
            { name: 'permalink', type: 'url' },
            { name: 'country', type: 'text' },
            { name: 'platform_type', type: 'text' },
            { name: 'social_network', type: 'text' }
        ]);

        await syncCollection('tiktok_daily_metrics', [
            { name: 'date', type: 'date' },
            { name: 'metric', type: 'text' },
            { name: 'value', type: 'number' },
            { name: 'platform', type: 'text' },
            { name: 'country', type: 'text' }
        ]);

    } catch (err) {
        console.error('Error syncing schema:', err.message);
        if (err.data) console.error('Error data:', JSON.stringify(err.data));
    }
}

syncSchema();
