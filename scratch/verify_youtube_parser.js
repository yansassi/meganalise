const fs = require('fs');
const path = require('path');
const { parseYouTubeCSV } = require('../server/services/parser');

// Files to test
const testFiles = [
    {
        name: 'Conteúdo (Video List)',
        path: 'Dados/Youtube/BR/Conteúdo 2025-04-13_2026-04-13 Mega Eletrônicos/Dados da tabela.csv'
    },
    {
        name: 'Origem do Tráfego (Dimension Chart)',
        path: 'Dados/Youtube/BR/Origem do tráfego 2025-04-13_2026-04-13 Mega Eletrônicos/Dados do gráfico.csv'
    },
    {
        name: 'Cidades (Dimension Chart with Names)',
        path: 'Dados/Youtube/BR/Cidades 2025-04-13_2026-04-13 Mega Eletrônicos/Dados do gráfico.csv'
    },
    {
        name: 'Gênero (Demographics Summary)',
        path: 'Dados/Youtube/BR/Gênero do espectador 2025-04-13_2026-04-13 Mega Eletrônicos/Dados da tabela.csv'
    }
];

async function runTest() {
    const rootPath = 'c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise';
    
    for (const test of testFiles) {
        console.log(`\n=== Testing: ${test.name} ===`);
        const fullPath = path.join(rootPath, test.path);
        
        if (!fs.existsSync(fullPath)) {
            console.error(`File not found: ${fullPath}`);
            continue;
        }

        const buffer = fs.readFileSync(fullPath);
        try {
            const result = await parseYouTubeCSV(buffer, path.basename(test.path));
            console.log(`Type detected: ${result.type}`);
            console.log(`Processed items: ${result.data.length || (result.data.data ? result.data.data.length : 0)}`);
            
            if (result.type === 'metric') {
                // Show a few unique metric names
                const uniqueMetrics = [...new Set(result.data.map(m => m.metric))];
                console.log(`Unique metrics found (${uniqueMetrics.length}):`, uniqueMetrics.slice(0, 8));
                console.log('Sample item:', result.data[0]);
            } else if (result.type === 'demographics') {
                console.log('Demographics category:', result.data.type);
                console.log('First 3 categories:', result.data.data.slice(0, 3));
            } else if (result.type === 'content') {
                console.log('First video:', result.data[0].title, 'Views:', result.data[0].views);
            }
        } catch (err) {
            console.error(`Error parsing ${test.name}:`, err);
        }
    }
}

runTest();
