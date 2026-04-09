const PB_URL = 'https://auth.meganalise.pro';

async function debugFilter() {
    try {
        // Test WITHOUT date filter - should return all records
        console.log('=== Test 1: No date filter ===');
        const res1 = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=5&filter=country%3D%22BR%22`, {});
        const data1 = await res1.json();
        console.log(`Total records (no date filter): ${data1.totalItems}`);
        if (data1.items?.length) console.log('First record date:', data1.items[0].date);

        // Test WITH date filter using ISO
        const startIso = '2025-01-01T00:00:00.000Z';
        const endIso = '2026-04-09T23:59:59.999Z';
        const filterStr = encodeURIComponent(`country="BR" && date >= "${startIso}" && date <= "${endIso}"`);
        
        console.log('\n=== Test 2: ISO date filter ===');
        const res2 = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=5&filter=${filterStr}`);
        const data2 = await res2.json();
        console.log(`Total records (ISO date filter): ${data2.totalItems}`);

        // Test WITH date filter (without T)
        const filterStr2 = encodeURIComponent(`country="BR" && date >= "2025-01-01 00:00:00" && date <= "2026-04-09 23:59:59"`);
        
        console.log('\n=== Test 3: Without T date filter ===');
        const res3 = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=5&filter=${filterStr2}`);
        const data3 = await res3.json();
        console.log(`Total records (no-T date filter): ${data3.totalItems}`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

debugFilter();
