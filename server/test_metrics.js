const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function testMetrics() {
    console.log('--- Testando arquivo de Visitas (UTF-16LE) ---');
    const buffer = fs.readFileSync('c:\\Users\\Yan Casa\\OneDrive\\Área de Trabalho\\MEGA\\Meganalise\\Dados\\Facebook\\BR\\Visitas.csv');
    const res = await parseFacebookCSV(buffer, 'Visitas.csv');
    console.log('Tipo detectado:', res.type);
    if (res.data) {
        console.log('Total de métricas:', res.data.length);
        if (res.data.length > 0) {
            console.log('Exemplo de métrica:', res.data[0]);
        }
    } else {
        console.log('Nenhum dado retornado.', res.message);
    }
}

testMetrics().catch(console.error);
