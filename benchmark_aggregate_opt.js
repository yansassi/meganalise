// Mock pb.collection().getList
const pb = {};
pb.collection = () => ({
  getFullList: async (options) => {
    // Simulate latency
    await new Promise(r => setTimeout(r, 30));

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
});

const run = async () => {
    console.time('aggregate');

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

    console.timeEnd('aggregate');
    console.log(totalReach, totalInteractions, totalFollowers);
}

run();
