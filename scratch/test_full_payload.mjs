const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

async function testWithPosting() {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: EMAIL, password: PASS })
    });
    const token = (await authRes.json()).token;

    // Test with ALL fields including ones not in schema
    const fullPayload = {
        original_id: 'TEST_FULL_001',
        title: 'Test full payload',
        permalink: 'https://www.facebook.com/test',
        platform_type: 'social',
        social_network: 'facebook',
        country: 'BR',
        date: '2026-01-15T12:00:00.000Z',
        posting_time: '09:00',
        reach: 1000,
        likes: 50,
        shares: 10,
        comments: 5,
        saved: 0,
        views: 500,
        clicks: 20,
        duration: 0,
        virality: '5.0',
        status: 'Completed',
        author: 'Mega Eletrônicos Paraguai',
        media_type: 'social'
    };

    const res = await fetch(`${PB_URL}/api/collections/facebook_content/records`, {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
    });
    const data = await res.json();
    
    console.log('Status:', res.status);
    if (!res.ok) {
        console.log('Error:', JSON.stringify(data, null, 2));
    } else {
        console.log('Success! Stored record:');
        // Delete test
        await fetch(`${PB_URL}/api/collections/facebook_content/records/${data.id}`, {
            method: 'DELETE', headers: { 'Authorization': token }
        });
        console.log('Deleted test record.');
    }
}

testWithPosting().catch(console.error);
