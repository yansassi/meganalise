const PocketBase = require('pocketbase/cjs');

async function listAllRegistriesDetails() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        const registries = await pb.collection('evidence_registries').getFullList();
        registries.forEach(r => {
            console.log(`ID: ${r.id}, Title: "${r.title}", Country: "${r.country}"`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listAllRegistriesDetails();
