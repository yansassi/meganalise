const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://auth.meganalise.pro');

async function testFilters() {
    try {
        const coll = 'facebook_audience_demographics';
        console.log(`Testing filters on ${coll}...`);
        
        const filters = [
            'platform = "facebook"',
            'country = "BR"',
            'import_date > "2020-01-01"'
        ];
        
        for (const f of filters) {
            try {
                await pb.collection(coll).getList(1, 1, { filter: f });
                console.log(`Filter [${f}]: OK`);
            } catch (err) {
                console.log(`Filter [${f}]: FAILED (${err.message})`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testFilters();
