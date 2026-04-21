const PocketBase = require('pocketbase/cjs');

async function checkSchema() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        const influencerColl = await pb.collections.getOne('influencers');
        console.log('Influencer Collection:', JSON.stringify(influencerColl, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
