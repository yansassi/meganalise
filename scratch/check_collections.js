const PocketBase = require('pocketbase/cjs');

async function checkCollections() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const collections = await pb.collections.getFullList();
        collections.forEach(c => {
            console.log(c.name);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkCollections();
