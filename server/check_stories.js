const fs = require('fs');
const { parseFacebookCSV } = require('./services/parser');

async function test() {
    const files = [
        'Feb-01-2026_Apr-20-2026_1300625435364732.csv',
        'Feb-01-2026_Apr-20-2026_1318105456840249.csv',
        'Feb-01-2026_Apr-20-2026_859829763815823.csv'
    ];

    for (const f of files) {
        const filePath = `c:/Users/Yan Casa/OneDrive/Área de Trabalho/MEGA/Meganalise/facebookdados/${f}`;
        const buffer = fs.readFileSync(filePath);
        const result = await parseFacebookCSV(buffer, f);
        
        const stories = result.data.filter(d => d.platform_type === 'story' || d.title?.toLowerCase().includes('story'));
        console.log(`File: ${f} -> Total Records: ${result.data.length}, Stories: ${stories.length}`);
        if (stories.length > 0) {
            const storyDates = stories.map(s => s.date).sort();
            console.log(`  Story dates: ${storyDates[0]} to ${storyDates[storyDates.length-1]}`);
        }
    }
}

test();
