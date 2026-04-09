import fs from 'fs';

const API_URL = 'https://api.meganalise.pro';
const DATA_DIR = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados';

// Upload just ONE file and check in detail
async function uploadSingleFile() {
    const fileName = 'Jan-09-2026_Apr-08-2026_1502952904598658.csv';
    const filePath = `${DATA_DIR}\\${fileName}`;
    
    console.log(`Uploading: ${fileName}...`);
    
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, fileName);
    formData.append('country', 'BR');
    
    const response = await fetch(`${API_URL}/api/upload/facebook`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Type:', data.type);
    console.log('Processed:', data.processed);
    console.log('Error count:', data.errors?.length || 0);
    
    // Show first 3 errors in full
    if (data.errors?.length > 0) {
        console.log('\nFirst 3 errors:');
        data.errors.slice(0, 3).forEach(e => console.log(' -', e));
    }
}

uploadSingleFile().catch(console.error);
