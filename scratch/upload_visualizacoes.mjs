import fs from 'fs';

const API_URL = 'https://api.meganalise.pro';
const DATA_DIR = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados';

// Upload the Visualizações file specifically to get impressions data
async function uploadVisualizacoes() {
    const fileName = 'Visualizações.csv';
    const filePath = `${DATA_DIR}\\${fileName}`;
    
    console.log(`Uploading: ${fileName}...`);
    
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(filePath)]);
    formData.append('file', blob, fileName);
    formData.append('country', 'BR');
    
    const response = await fetch(`${API_URL}/api/upload/facebook`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(data));
}

uploadVisualizacoes().catch(console.error);
