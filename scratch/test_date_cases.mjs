const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

// This simulates exactly what upload.js does server-side
// The question is: what exactly is item.date when the error "Invalid time value" occurs?

async function testDirectInsert() {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: EMAIL, password: PASS })
    });
    const token = (await authRes.json()).token;

    // Test cases that could cause "Invalid time value"
    const testCases = [
        { date: null, label: 'null date' },
        { date: undefined, label: 'undefined date' },
        { date: '', label: 'empty string date' },
        { date: 'Total', label: '"Total" string' },
        { date: '2026-01-15', label: 'YYYY-MM-DD (no time)' },
        { date: '2026-01-15T12:00:00.000Z', label: 'Full ISO' },
    ];

    for (const { date, label } of testCases) {
        // Simulate the IIFE from upload.js
        let computedDate;
        try {
            if (!date) {
                computedDate = new Date().toISOString();
            } else {
                const datePart = date.split('T')[0];
                const parsed = new Date(datePart + 'T12:00:00.000Z');
                computedDate = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
            }
        } catch(e) {
            computedDate = `ERROR: ${e.message}`;
        }
        
        console.log(`\nCase: ${label}`);
        console.log(`  Input: ${JSON.stringify(date)}`);
        console.log(`  Output: ${computedDate}`);
        
        // Try inserting with this date
        const res = await fetch(`${PB_URL}/api/collections/facebook_content/records`, {
            method: 'POST',
            headers: { 
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                original_id: `TEST_${Date.now()}`,
                title: `Test ${label}`,
                country: 'BR',
                date: computedDate,
            })
        });
        const data = await res.json();
        
        if (res.ok) {
            console.log(`  PocketBase result: OK (date stored as: ${data.date})`);
            // Delete test
            await fetch(`${PB_URL}/api/collections/facebook_content/records/${data.id}`, {
                method: 'DELETE', headers: { 'Authorization': token }
            });
        } else {
            console.log(`  PocketBase result: ERROR ${res.status} - ${JSON.stringify(data)}`);
        }
    }
}

testDirectInsert().catch(console.error);
