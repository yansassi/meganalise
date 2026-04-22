const PocketBase = require('pocketbase/cjs');

async function checkXiaomiPY() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Finding Xiaomi PY registry...');
        const registry = await pb.collection('evidence_registries').getFirstListItem('title = "Xiaomi" && country = "PY"');
        console.log('Registry ID:', registry.id);

        const metrics = await pb.collection('instagram_daily_metrics').getList(1, 5, {
            filter: `influencer_id = "${registry.id}" && country = "PY"`,
            sort: '-date'
        });

        console.log('Total metrics found for Xiaomi PY:', metrics.totalItems);
        metrics.items.forEach(m => {
            console.log('Date:', m.date, 'Followers:', m.followers);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkXiaomiPY();
