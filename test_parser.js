
import fs from 'fs';
import { instagramParser } from './client/src/services/instagramParser.js';
import path from 'path';

// Polyfills
import { Blob } from 'buffer';

class MockFileReader {
    readAsArrayBuffer(file) {
        setTimeout(() => {
            if (this.onload) {
                this.onload({ target: { result: file.buffer } });
            }
        }, 10);
    }
}
global.FileReader = MockFileReader;
global.TextDecoder = TextDecoder;

class MockFile {
    constructor(buffer, name) {
        this.buffer = buffer;
        this.name = name;
    }
}

async function testParser() {
    const files = [
        { path: 'c:/Users/Yan Casa/OneDrive/VPS/Sistemas/Meganalise/dados_fornecido/instagram/Interações.csv', testName: 'random_name_1.csv', expected: 'interactions' },
        { path: 'c:/Users/Yan Casa/OneDrive/VPS/Sistemas/Meganalise/dados_fornecido/instagram/Alcance.csv', testName: 'random_name_2.csv', expected: 'reach' }
    ];

    for (const fileDef of files) {
        if (!fs.existsSync(fileDef.path)) {
            console.error(`File not found: ${fileDef.path}`);
            continue;
        }

        const nodeBuffer = fs.readFileSync(fileDef.path);
        const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);

        // Simulating a file with a generic name but correct content
        const file = new MockFile(arrayBuffer, fileDef.testName);

        console.log(`Testing content of ${path.basename(fileDef.path)} as ${file.name}...`);
        try {
            const result = await instagramParser.parseFile(file);
            console.log(`Detected type: ${result.type}`);
            if (result.type === 'metric') {
                console.log(`Detected metric: ${result.metric}`);
                if (result.metric === fileDef.expected) {
                    console.log('✅ SUCCESS: Correctly identified.');
                } else {
                    console.log(`❌ FAILURE: Expected ${fileDef.expected}, got ${result.metric}`);
                }
            } else {
                console.log('❌ FAILURE: Incorrect type detected.');
            }
        } catch (e) {
            console.error(`Error parsing:`, e);
        }
        console.log('---');
    }
}

testParser();
