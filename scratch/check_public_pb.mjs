const PB_URL = 'https://auth.meganalise.pro';

async function checkPublic() {
    try {
        const collections = ['facebook_daily_metrics', 'facebook_content', 'instagram_daily_metrics'];
        
        for (const coll of collections) {
            console.log(`\n--- ${coll} ---`);
            const recordsRes = await fetch(`${PB_URL}/api/collections/${coll}/records?perPage=5&sort=-created`);
            const data = await recordsRes.json();
            
            if (!recordsRes.ok) {
                console.log(`Failed to fetch ${coll}: ${recordsRes.status} ${JSON.stringify(data)}`);
                continue;
            }

            console.log(`Total records: ${data.totalItems}`);
            if (data.items && data.items.length > 0) {
                console.log('Latest records:');
                data.items.forEach(i => {
                    console.log(`- Date: ${i.date}, Metric: ${i.metric}, Value: ${i.value}, Platform: ${i.platform}, Country: ${i.country}`);
                });
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkPublic();
