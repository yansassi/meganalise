const PocketBase = require('pocketbase/cjs');

async function checkWinieDeepSearch() {
    const pb = new PocketBase('https://auth.meganalise.pro');
    try {
        await pb.admins.authWithPassword('yankingparts@gmail.com', '@YFS23aea06nrs');
        
        console.log('Deep search for "Winie" in ALL story records...');
        const records = await pb.collection('instagram_content').getFullList({
            filter: 'platform_type = "story"',
        });

        const found = records.filter(r => {
            const str = JSON.stringify(r).toLowerCase();
            return str.includes('winie') || str.includes('dicadawinie');
        });

        console.log('Total found:', found.length);
        found.forEach(r => {
            console.log('---');
            console.log('ID:', r.original_id);
            console.log('Author:', r.author);
            console.log('Title:', r.title);
            console.log('Permalink:', r.permalink);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkWinieDeepSearch();
