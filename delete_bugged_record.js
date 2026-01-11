const { pb } = require('./server/services/db');

(async () => {
    try {
        const recordId = 'pkrn2mdnqhds7pw';
        console.log(`Deleting record ${recordId}...`);
        await pb.collection('instagram_content').delete(recordId);
        console.log('Record deleted successfully.');
    } catch (e) {
        console.error('Error deleting record:', e.message);
    }
})();
