const pb = {};
pb.collection = () => ({
  getFullList: async (options) => {
    await new Promise(r => setTimeout(r, 100)); // Simulate longer network fetch for full list
    const items = [];
    for (let i = 0; i < 10000; i++) {
      const metrics = ['reach', 'interactions', 'followers', 'other'];
      items.push({
        metric: metrics[Math.floor(Math.random() * metrics.length)],
        value: Math.floor(Math.random() * 100)
      });
    }
    return items;
  },
  getList: async (page, batchSize) => {
    await new Promise(r => setTimeout(r, 10)); // Simulated faster individual request
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
  }
});

const run = async () => {
    console.time('aggregate_getFullList');
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
    console.timeEnd('aggregate_getFullList');

    console.time('aggregate_parallel_getList');
    totalReach = 0;
    totalInteractions = 0;
    totalFollowers = 0;
    const batchSize = 500;

    const firstPage = await pb.collection('instagram_daily_metrics').getList(1, batchSize, {
        filter: 'country = "US"',
        requestKey: null,
        fields: 'metric,value'
    });

    const processItems = (items) => {
        let reach = 0, int = 0, foll = 0;
        for (const m of items) {
            const val = Number(m.value) || 0;
            if (m.metric === 'reach') reach += val;
            else if (m.metric === 'interactions') int += val;
            else if (m.metric === 'followers') foll += val;
        }
        return { reach, int, foll };
    };

    let { reach, int, foll } = processItems(firstPage.items);
    totalReach += reach;
    totalInteractions += int;
    totalFollowers += foll;

    if (firstPage.totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= firstPage.totalPages; p++) {
            promises.push(
                pb.collection('instagram_daily_metrics').getList(p, batchSize, {
                    filter: 'country = "US"',
                    requestKey: null,
                    fields: 'metric,value'
                })
            );
        }
        const results = await Promise.all(promises);
        for (const res of results) {
            const partial = processItems(res.items);
            totalReach += partial.reach;
            totalInteractions += partial.int;
            totalFollowers += partial.foll;
        }
    }
    console.timeEnd('aggregate_parallel_getList');
}

run();
