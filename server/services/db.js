require('dotenv').config();
const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.PB_URL);

// Auto-cancellation is not needed for backend scripts usually
pb.autoCancellation(false);

module.exports = { pb };
