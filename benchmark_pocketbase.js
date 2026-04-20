const { pb } = require('./server/services/db');

async function testPb() {
  try {
    const list = await pb.collection('instagram_daily_metrics').getList(1, 1, {
      fields: 'metric,value',
      requestKey: null
    });
    console.log("Success! Items:", list.items.length);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
testPb();
