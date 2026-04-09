import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'https://api.meganalise.pro';
const DATA_DIR = 'c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\facebook-dados';

// Files to upload - these are the main ones for Facebook metrics
const FILES_TO_UPLOAD = [
    'Visualizações.csv',
    'Interações.csv',
    'Seguidores.csv',
    'Visitas.csv',
    'Cliques no link.csv',
    'Jan-09-2026_Apr-08-2026_1502952904598658.csv',
    'Jan-09-2026_Apr-08-2026_969742732228570.csv',
    'Jan-09-2026_Apr-08-2026_1653285452656379.csv',
];

async function uploadFile(filePath, fileName) {
    console.log(`\nUploading: ${fileName}...`);
    
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
    
    if (response.ok) {
        console.log(`✅ Success: ${JSON.stringify(data)}`);
    } else {
        console.log(`❌ Error (${response.status}): ${JSON.stringify(data)}`);
    }
}

async function uploadAll() {
    for (const fileName of FILES_TO_UPLOAD) {
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${fileName}`);
            continue;
        }
        await uploadFile(filePath, fileName);
        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('\n✅ All uploads attempted!');
}

uploadAll();
