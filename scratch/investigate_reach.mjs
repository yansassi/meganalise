const PB_URL = 'https://auth.meganalise.pro';
const EMAIL = 'yankingparts@gmail.com';
const PASS = '@YFS23aea06nrs';

// The old upload saved "Visualizações.csv" as metric='reach'
// We need to duplicate those records as metric='impressions' (since 'reach' is already used by other file)
// OR we change the metric name directly for the Visualizações records

async function migrateVisualizacoes() {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: EMAIL, password: PASS })
    });
    const token = (await authRes.json()).token;

    // First, understand how many 'reach' records there are
    const reachRes = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=500&filter=metric%3D%22reach%22`, {
        headers: { 'Authorization': token }
    });
    const reachData = await reachRes.json();
    console.log(`Total 'reach' records: ${reachData.totalItems}`);
    
    // How many records of other types are there?
    const allRes = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=10`, {
        headers: { 'Authorization': token }
    });
    const allData = await allRes.json();
    console.log(`Total records: ${allData.totalItems}`);

    // The issue: 'Visualizações' was mapped to 'reach' before.
    // Now we want it to be 'impressions'.
    // But 'reach' might actually be REACH data (from a different file).
    // Let's check: are there TWO different files - one for Alcance (reach) and one for Visualizações?
    
    // Looking at the facebook-dados folder:
    // - Visualizações.csv -> should be impressions
    // - There might not be an Alcance.csv -> reach might be from Visualizações

    // Given the data structure, we have 365 records of 'reach' (one per day for a year)
    // The Visualizações.csv has 90 rows (last 90 days)
    // This suggests the 'reach' data may actually have been from a SEPARATE source

    // Let's check the date range of 'reach' records
    const reachSample = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=5&sort=date&filter=metric%3D%22reach%22`, {
        headers: { 'Authorization': token }
    });
    const reachSampleData = await reachSample.json();
    console.log('\nEarliest reach records:');
    reachSampleData.items?.forEach(r => console.log(`  ${r.date}: ${r.value}`));
    
    const reachLatest = await fetch(`${PB_URL}/api/collections/facebook_daily_metrics/records?perPage=5&sort=-date&filter=metric%3D%22reach%22`, {
        headers: { 'Authorization': token }
    });
    const reachLatestData = await reachLatest.json();
    console.log('Latest reach records:');
    reachLatestData.items?.forEach(r => console.log(`  ${r.date}: ${r.value}`));
}

migrateVisualizacoes().catch(console.error);
