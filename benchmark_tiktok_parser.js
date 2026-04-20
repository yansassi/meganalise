const { parseTikTokCSV } = require('./server/services/parser.js');

async function runBenchmark() {
    let csvData = 'Video Link,Video Title,Post Time,Total Likes,Total Comments,Total Shares,Total Views,Adicionar aos Favoritos\n';
    for (let i = 0; i < 5000; i++) {
        csvData += `https://tiktok.com/video/${i},Video ${i},2023-01-01 12:00:00,100,10,5,1000,2\n`;
    }

    const iterations = 50;
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
        await parseTikTokCSV(Buffer.from(csvData), 'mock.csv');
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000;

    console.log(`Baseline Execution Time: ${durationMs.toFixed(2)}ms for ${iterations} iterations`);
}

runBenchmark().catch(console.error);
