const PocketBase = require('pocketbase/cjs');

async function checkParaguayRegistries() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking Paraguay registries...');
        const registries = await pb.collection('evidence_registries').getFullList({
            filter: 'country = "paraguay"',
        });

        registries.forEach(r => {
            console.log('---');
            console.log('ID:', r.id);
            console.log('Title:', r.title);
            console.log('Handle:', r.handle);
            console.log('Country:', r.country);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkParaguayRegistries();
