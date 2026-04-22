const PocketBase = require('pocketbase/cjs');

async function checkAllRegistriesCountry() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Checking all registries countries...');
        const registries = await pb.collection('evidence_registries').getFullList();

        const countryCounts = {};
        registries.forEach(r => {
            countryCounts[r.country] = (countryCounts[r.country] || 0) + 1;
            if (r.country !== 'brasil') {
                console.log(`Influencer: ${r.title}, Country: ${r.country}`);
            }
        });
        console.log('Country counts:', countryCounts);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkAllRegistriesCountry();
