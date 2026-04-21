
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase(process.env.PB_URL || 'https://auth.meganalise.pro');
pb.autoCancellation(false);

async function checkSchema() {
    try {
        const collections = await pb.collections.getList(1, 50);
        const audienceColl = collections.items.find(c => c.name === 'instagram_audience_demographics');
        if (audienceColl) {
            console.log('Fields for instagram_audience_demographics:');
            console.log(audienceColl.schema.map(f => f.name));
        } else {
            console.log('Collection instagram_audience_demographics not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
