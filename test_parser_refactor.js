const assert = require('assert');
const { normalizeContentData } = require('./server/services/parser.js');

const testNormalizeContentData = () => {
    console.log('Running test: testNormalizeContentData');

    const data = [
        {
            'Data': '01/01/2024',
            'Alcance': '1000',
            'Curtidas': '100',
            'Comentários': '10',
            'Compartilhamentos': '5',
            'Salvamentos': '2',
            'Visualizações': '500',
        }
    ];

    const result = normalizeContentData(data);

    assert.strictEqual(result.length, 1, 'Test Failed: Incorrect number of rows');
    assert.strictEqual(result[0].reach, 1000, 'Test Failed: Incorrect reach');
    assert.strictEqual(result[0].likes, 100, 'Test Failed: Incorrect likes');
    assert.strictEqual(result[0].comments, 10, 'Test Failed: Incorrect comments');
    assert.strictEqual(result[0].shares, 5, 'Test Failed: Incorrect shares');
    assert.strictEqual(result[0].saved, 2, 'Test Failed: Incorrect saved');
    assert.strictEqual(result[0].views, 500, 'Test Failed: Incorrect views');

    console.log('Test Passed: testNormalizeContentData');
};

testNormalizeContentData();
