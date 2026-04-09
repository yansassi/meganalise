const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function checkSchema() {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: EMAIL, password: PASS })
    });
    const token = (await authRes.json()).token;

    // Get facebook_content schema
    const res = await fetch(`${PB_URL}/api/collections/facebook_content`, {
        headers: { 'Authorization': token }
    });
    const data = await res.json();
    
    console.log('facebook_content schema:');
    data.fields?.forEach(f => {
        console.log(`  ${f.name}: type=${f.type}${f.required ? ' (required)' : ''}`);
    });
    
    // Get a sample record to see how dates are stored
    const sampleRes = await fetch(`${PB_URL}/api/collections/facebook_content/records?perPage=3&sort=-created`, {
        headers: { 'Authorization': token }
    });
    const sampleData = await sampleRes.json();
    
    console.log('\nSample records (date field):');
    sampleData.items?.forEach(r => {
        console.log(`  ID: ${r.id}, date: "${r.date}", original_id: ${r.original_id?.substring(0, 15)}`);
    });
}

checkSchema().catch(console.error);
