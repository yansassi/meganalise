const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function test() {
    console.log('--- Testando arquivo de Vídeos (Potenciais Stories) ---');
    const videoBuffer = fs.readFileSync('c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\Dados\\Facebook\\BR\\Jan-12-2026_Apr-12-2026_2580246192373029.csv');
    const videoRes = await parseFacebookCSV(videoBuffer, 'Videos.csv');
    console.log('Tipo detectado:', videoRes.type);
    const stories = videoRes.data.filter(d => d.platform === 'story');
    console.log('Stories identificados:', stories.length);
    if (stories.length > 0) {
        console.log('Exemplo de Story:', {
            id: stories[0].id,
            title: stories[0].title,
            platform: stories[0].platform,
            permalink: stories[0].permalink
        });
    }

    console.log('\n--- Testando arquivo de Publicações Gerais ---');
    const generalBuffer = fs.readFileSync('c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\Dados\\Facebook\\BR\\Jan-12-2026_Apr-12-2026_1734171741293299.csv');
    const generalRes = await parseFacebookCSV(generalBuffer, 'Geral.csv');
    console.log('Tipo detectado:', generalRes.type);
    console.log('Total de itens:', generalRes.data.length);
    const reels = generalRes.data.filter(d => d.platform === 'video');
    console.log('Reels/Videos identificados:', reels.length);
}

test().catch(console.error);
