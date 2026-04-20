const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock database to test exact same code logic in route
let mockPages = [];

Module.prototype.require = function() {
    if (arguments[0] === 'pocketbase/cjs') {
        return class PocketBase {
            constructor() {}
            autoCancellation() {}
            collection() {
                return {
                    getList: async (page, batchSize) => {
                        // Simulate latency
                        await new Promise(r => setTimeout(r, 10));
                        if (page > 20) return { items: [], totalPages: 20 };
                        const items = [];
                        for (let i = 0; i < batchSize; i++) {
                            const metrics = ['reach', 'interactions', 'followers', 'other'];
                            items.push({
                                metric: metrics[Math.floor(Math.random() * metrics.length)],
                                value: Math.floor(Math.random() * 100)
                            });
                        }
                        return { items, totalPages: 20 };
                    },
                    getFullList: async () => {
                        await new Promise(r => setTimeout(r, 100)); // slightly larger initial latency
                        const items = [];
                        for (let i = 0; i < 10000; i++) {
                            const metrics = ['reach', 'interactions', 'followers', 'other'];
                            items.push({
                                metric: metrics[Math.floor(Math.random() * metrics.length)],
                                value: Math.floor(Math.random() * 100)
                            });
                        }
                        return items;
                    }
                };
            }
        };
    }
    if (arguments[0] === 'dotenv') {
        return { config: () => {} };
    }
    return originalRequire.apply(this, arguments);
};

const { pb } = require('./server/services/db');

const runBaseline = async () => {
    console.time('baseline');
    let page = 1;
    const batchSize = 500;
    let hasMore = true;

    let totalReach = 0;
    let totalInteractions = 0;
    let totalFollowers = 0;

    while (hasMore) {
        const result = await pb.collection('instagram_daily_metrics').getList(page, batchSize, {
            filter: 'country = "US"',
            requestKey: null,
            fields: 'metric,value'
        });

        const items = result.items;
        if (items.length === 0) {
            hasMore = false;
            break;
        }

        for (const m of items) {
            const val = Number(m.value) || 0;
            if (m.metric === 'reach') totalReach += val;
            else if (m.metric === 'interactions') totalInteractions += val;
            else if (m.metric === 'followers') totalFollowers += val;
        }

        if (page >= result.totalPages) {
            hasMore = false;
        }
        page++;
    }
    console.timeEnd('baseline');
};

const runOptimized = async () => {
    console.time('optimized_getFullList');
    let totalReach = 0;
    let totalInteractions = 0;
    let totalFollowers = 0;

    const items = await pb.collection('instagram_daily_metrics').getFullList({
        filter: 'country = "US"',
        requestKey: null,
        fields: 'metric,value'
    });

    for (const m of items) {
        const val = Number(m.value) || 0;
        if (m.metric === 'reach') totalReach += val;
        else if (m.metric === 'interactions') totalInteractions += val;
        else if (m.metric === 'followers') totalFollowers += val;
    }
    console.timeEnd('optimized_getFullList');
};

const runOptimizedParallel = async () => {
    console.time('optimized_parallel_getList');
    let totalReach = 0;
    let totalInteractions = 0;
    let totalFollowers = 0;
    const batchSize = 500;

    const firstPage = await pb.collection('instagram_daily_metrics').getList(1, batchSize, {
        filter: 'country = "US"',
        requestKey: null,
        fields: 'metric,value'
    });

    const processItems = (items) => {
        for (const m of items) {
            const val = Number(m.value) || 0;
            if (m.metric === 'reach') totalReach += val;
            else if (m.metric === 'interactions') totalInteractions += val;
            else if (m.metric === 'followers') totalFollowers += val;
        }
    };

    processItems(firstPage.items);

    if (firstPage.totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= firstPage.totalPages; p++) {
            promises.push(
                pb.collection('instagram_daily_metrics').getList(p, batchSize, {
                    filter: 'country = "US"',
                    requestKey: null,
                    fields: 'metric,value'
                }).then(res => processItems(res.items))
            );
        }
        await Promise.all(promises);
    }

    console.timeEnd('optimized_parallel_getList');
};


async function run() {
    await runBaseline();
    await runOptimized();
    await runOptimizedParallel();
}
run();
