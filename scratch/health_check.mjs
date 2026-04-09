// Health check + re-upload de todos os arquivos do Facebook
const API_URL = 'https://api.meganalise.pro';

async function checkHealth() {
    const res = await fetch(`${API_URL}/`);
    const data = await res.json();
    console.log('API Status:', res.status, JSON.stringify(data));
    return res.ok;
}

checkHealth().then(ok => {
    if (ok) console.log('✅ Server is up!');
    else console.log('❌ Server not ready');
}).catch(e => console.error('Server error:', e.message));
