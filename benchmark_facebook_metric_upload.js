
const { performance } = require('perf_hooks');

// Mock PocketBase
class MockPocketBase {
    constructor() {
        this.store = new Map(); // id -> record
        this.calls = {
            getList: 0,
            getFullList: 0,
            create: 0,
            update: 0
        };
        // Pre-seed some data
        this.seedData();
    }

    seedData() {
        // Add some existing metrics
        const dates = ['2023-01-01', '2023-01-02', '2023-01-03'];
        const metrics = ['impressions', 'reach', 'clicks'];
        let id = 1;
        for (const date of dates) {
            for (const metric of metrics) {
                const record = {
                    id: `id_${id++}`,
                    date: date,
                    metric: metric,
                    platform: 'facebook',
                    country: 'BR',
                    value: 100
                };
                // Store key: simplistic check
                this.store.set(record.id, record);
            }
        }
    }

    collection(name) {
        return {
            getList: async (page, perPage, options) => {
                this.calls.getList++;
                await new Promise(r => setTimeout(r, 50)); // Simulate 50ms latency

                // Very basic filter parsing for the benchmark
                // filter: `date = "${item.date}" && metric = "${item.metric}" && platform = "facebook" && country = "${country}"`
                const filter = options.filter;
                const dateMatch = filter.match(/date = "([^"]+)"/);
                const metricMatch = filter.match(/metric = "([^"]+)"/);

                if (dateMatch && metricMatch) {
                    const date = dateMatch[1];
                    const metric = metricMatch[1];
                    const items = Array.from(this.store.values()).filter(r => r.date === date && r.metric === metric);
                    return { items };
                }
                return { items: [] };
            },
            getFullList: async (options) => {
                this.calls.getFullList++;
                await new Promise(r => setTimeout(r, 50)); // Simulate 50ms latency for list too

                // Naive implementation for benchmark: return everything matching platform/country and dates if present
                const filter = options.filter;
                // Check if it's the optimized query
                if (filter.includes('date >=')) {
                    // Range query simulation
                    const minDateMatch = filter.match(/date >= "([^"]+)"/);
                    const maxDateMatch = filter.match(/date <= "([^"]+)"/);
                    const minDate = minDateMatch ? minDateMatch[1] : null;
                    const maxDate = maxDateMatch ? maxDateMatch[1] : null;

                    const items = Array.from(this.store.values()).filter(r => {
                        return r.platform === 'facebook' && r.country === 'BR' &&
                               (!minDate || r.date >= minDate) &&
                               (!maxDate || r.date <= maxDate);
                    });
                    return items;
                }

                return [];
            },
            create: async (data) => {
                this.calls.create++;
                await new Promise(r => setTimeout(r, 50)); // Simulate 50ms latency
                const newId = `id_${this.store.size + 1}`;
                this.store.set(newId, { ...data, id: newId });
                return { ...data, id: newId };
            },
            update: async (id, data) => {
                this.calls.update++;
                await new Promise(r => setTimeout(r, 50)); // Simulate 50ms latency
                const existing = this.store.get(id);
                if (existing) {
                    this.store.set(id, { ...existing, ...data });
                }
                return { ...existing, ...data };
            }
        };
    }
}

async function runBenchmark() {
    console.log("Generating test data...");
    const testData = [];
    const dates = ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05'];
    const metrics = ['impressions', 'reach', 'clicks', 'engagements', 'likes'];

    // 5 dates * 5 metrics = 25 items. Some exist (seeded), some don't.
    // Seeded data covers 2023-01-01 to 03 for first 3 metrics.

    for (const date of dates) {
        for (const metric of metrics) {
            testData.push({
                date: date,
                metric: metric,
                value: Math.floor(Math.random() * 1000)
            });
        }
    }
    console.log(`Test data size: ${testData.length} items`);

    const country = 'BR';

    // --- BASELINE ---
    console.log("\nRunning BASELINE (Current Implementation)...");
    const pbBaseline = new MockPocketBase();
    const startBaseline = performance.now();

    // Logic from server/routes/upload.js
    const baselinePromises = testData.map(async (item) => {
        try {
            const existing = await pbBaseline.collection('facebook_daily_metrics').getList(1, 1, {
                filter: `date = "${item.date}" && metric = "${item.metric}" && platform = "facebook" && country = "${country}"`,
                requestKey: null
            });

            if (existing.items.length > 0) {
                await pbBaseline.collection('facebook_daily_metrics').update(existing.items[0].id, {
                    value: item.value,
                    country: country
                }, { requestKey: null });
            } else {
                await pbBaseline.collection('facebook_daily_metrics').create({
                    platform: 'facebook',
                    date: item.date,
                    metric: item.metric,
                    value: item.value,
                    country: country
                }, { requestKey: null });
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });
    await Promise.all(baselinePromises);

    const endBaseline = performance.now();
    console.log(`Baseline Time: ${(endBaseline - startBaseline).toFixed(2)}ms`);
    console.log(`Baseline Calls: getList=${pbBaseline.calls.getList}, getFullList=${pbBaseline.calls.getFullList}, create=${pbBaseline.calls.create}, update=${pbBaseline.calls.update}`);
    console.log(`Total DB Ops: ${pbBaseline.calls.getList + pbBaseline.calls.getFullList + pbBaseline.calls.create + pbBaseline.calls.update}`);


    // --- OPTIMIZED ---
    console.log("\nRunning OPTIMIZED Implementation...");
    const pbOptimized = new MockPocketBase();
    const startOptimized = performance.now();

    // Proposed Logic
    if (testData.length > 0) {
        // 1. Identify date range
        // Assuming testData is not necessarily sorted
        const allDates = testData.map(d => d.date).sort();
        const minDate = allDates[0];
        const maxDate = allDates[allDates.length - 1];

        // 2. Fetch existing records in bulk
        // We fetch by platform, country and date range
        const existingRecords = await pbOptimized.collection('facebook_daily_metrics').getFullList({
            filter: `platform = "facebook" && country = "${country}" && date >= "${minDate}" && date <= "${maxDate}"`,
            requestKey: null
        });

        // 3. Map for lookup
        const existingMap = new Map(); // key: date_metric
        for (const rec of existingRecords) {
            existingMap.set(`${rec.date}_${rec.metric}`, rec);
        }

        // 4. Process
        const BATCH_SIZE = 20; // Process in batches to control write concurrency
        for (let i = 0; i < testData.length; i += BATCH_SIZE) {
            const chunk = testData.slice(i, i + BATCH_SIZE);
            await Promise.all(chunk.map(async (item) => {
                const key = `${item.date}_${item.metric}`;
                const existing = existingMap.get(key);

                if (existing) {
                     await pbOptimized.collection('facebook_daily_metrics').update(existing.id, {
                        value: item.value,
                        country: country
                    }, { requestKey: null });
                } else {
                    await pbOptimized.collection('facebook_daily_metrics').create({
                        platform: 'facebook',
                        date: item.date,
                        metric: item.metric,
                        value: item.value,
                        country: country
                    }, { requestKey: null });
                }
            }));
        }
    }

    const endOptimized = performance.now();
    console.log(`Optimized Time: ${(endOptimized - startOptimized).toFixed(2)}ms`);
    console.log(`Optimized Calls: getList=${pbOptimized.calls.getList}, getFullList=${pbOptimized.calls.getFullList}, create=${pbOptimized.calls.create}, update=${pbOptimized.calls.update}`);
    console.log(`Total DB Ops: ${pbOptimized.calls.getList + pbOptimized.calls.getFullList + pbOptimized.calls.create + pbOptimized.calls.update}`);
}

runBenchmark();
