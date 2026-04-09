// Check if the server has the new code by testing a diagnostic endpoint or by seeing if the error message changed
const API_URL = 'https://api.meganalise.pro';

async function checkServerVersion() {
    // Upload a tiny metric file to see if the server's behavior changed
    const csvContent = `sep=,\n"Visualizadores"\n"Data","Primary"\n"2026-04-01T00:00:00","100"\n`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    const formData = new FormData();
    formData.append('file', blob, 'Visualizadores.csv');
    formData.append('country', 'BR');
    
    const res = await fetch(`${API_URL}/api/upload/facebook`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    console.log('Simple upload response:', JSON.stringify(data));
}

checkServerVersion().catch(console.error);
