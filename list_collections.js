
const PocketBase = require('pocketbase/cjs');

async function listCollections() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        const collections = await pb.collections.getList(1, 100);
        console.log(JSON.stringify(collections.items.map(c => ({ id: c.id, name: c.name })), null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listCollections();
