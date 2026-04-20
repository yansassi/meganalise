const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function() {
    if (arguments[0] === 'pocketbase/cjs') {
        return class PocketBase {
            constructor() {}
            autoCancellation() {}
        };
    }
    if (arguments[0] === 'dotenv') {
        return { config: () => {} };
    }
    return originalRequire.apply(this, arguments);
};

const { pb } = require('./server/services/db');
console.log('db mocked successfully');
