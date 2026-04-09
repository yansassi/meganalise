import fs from 'fs';

const API_URL = 'https://api.meganalise.pro';
const DATA_DIR = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados';

// Upload and get FULL error details
async function uploadWithDebug() {
    const fileName = 'Jan-09-2026_Apr-08-2026_1502952904598658.csv';
    const filePath = `${DATA_DIR}\\${fileName}`;
    
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(filePath)]);
    formData.append('file', blob, fileName);
    formData.append('country', 'BR');
    
    const response = await fetch(`${API_URL}/api/upload/facebook`, {
        method: 'POST', body: formData
    });
    
    const data = await response.json();
    
    console.log(`Processed: ${data.processed}`);
    console.log(`Error count: ${data.errors?.length}`);
    
    // Show ALL errors with detail
    if (data.errors?.length > 0) {
        console.log('\nAll errors:');
        data.errors.forEach(e => console.log(e));
    }
}

uploadWithDebug().catch(console.error);
