const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function testInsert() {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: EMAIL, password: PASS })
    });
    const token = (await authRes.json()).token;

    // Test inserting a record with the exact payload the upload.js sends
    const testPayload = {
        original_id: 'TEST_001',
        title: 'Test post',
        permalink: 'https://www.facebook.com/test',
        platform_type: 'social', // This might not be valid for 'platform' select field
        social_network: 'facebook',
        country: 'BR',
        date: '2026-01-15T12:00:00.000Z', // ISO format
        posting_time: '09:00',
        reach: 1000,
        likes: 50,
        shares: 10,
        comments: 5,
    };

    console.log('Testing with payload:', JSON.stringify(testPayload, null, 2));
    
    const res = await fetch(`${PB_URL}/api/collections/facebook_content/records`, {
        method: 'POST',
        headers: { 
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
    });
    
    const data = await res.json();
    console.log('\nResult status:', res.status);
    console.log('Result data:', JSON.stringify(data, null, 2));
    
    // Clean up test record
    if (res.ok && data.id) {
        await fetch(`${PB_URL}/api/collections/facebook_content/records/${data.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        console.log('Test record deleted.');
    }
}

testInsert().catch(console.error);
