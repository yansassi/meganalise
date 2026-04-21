const express = require('express');
const { pb } = require('../services/db');

const router = express.Router();

// Helper to format date for PB filter
const formatDate = (dateStr) => {
    // Ensure YYYY-MM-DD
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().split('T')[0];
};

router.get('/aggregate/:country', async (req, res) => {
    try {
        const { country } = req.params;
        const { startDate, endDate } = req.query;

        console.log(`Getting aggregate data for ${country}, range: ${startDate} to ${endDate}`);

        let filter = pb.filter('country = {:country}', { country });
        if (startDate && endDate) {
            const start = new Date(startDate).toISOString();
            const endDateObj = new Date(endDate);
            endDateObj.setUTCHours(23, 59, 59, 999);
            const end = endDateObj.toISOString();
            filter += pb.filter(' && date >= {:start} && date <= {:end}', { start, end });
        }

        // We paginate to avoid loading all records into memory at once
        // and perform aggregation in-memory.
        const batchSize = 500;

        let totalReach = 0;
        let totalInteractions = 0;
        let totalFollowers = 0; // Followers are tricky - usually last record value, but here we sum?
                                // Dashboard.jsx sums them: if (m.metric === 'followers') totalFollowers += m.value;
                                // This implies daily follower GAIN? Or just sum of follower count snapshots?
                                // If it's sum of daily snapshots, that's weird for "Total Followers".
                                // But we must preserve existing logic.

        // Also, we need to return something that Dashboard.jsx can consume.
        // Dashboard.jsx expects `data.metrics` array and iterates it.
        // If we want to return a small array that produces the same sum, we can do that.
        // Or we can return the full list if requested, but the task is to optimize.

        // Optimization: Return a condensed list of metrics containing the sums.
        // This avoids sending 10k records.
        // Dashboard.jsx logic:
        // data.metrics.forEach(m => {
        //    if (m.metric === 'reach') totalReach += m.value;
        //    if (m.metric === 'interactions') totalEngagement += m.value;
        //    if (m.metric === 'followers') totalFollowers += m.value;
        // });

        // So if we return 3 items:
        // [{ metric: 'reach', value: sumReach }, { metric: 'interactions', value: sumInteractions }, ...]
        // The dashboard will calculate the correct totals!

        const firstPage = await pb.collection('instagram_daily_metrics').getList(1, batchSize, {
            filter: filter,
            requestKey: null,
            fields: 'metric,value' // Select only needed fields to save memory/bandwidth
        });

        const processItems = (items) => {
            let reach = 0, interactions = 0, followers = 0;
            for (const m of items) {
                const val = Number(m.value) || 0;
                if (m.metric === 'reach') reach += val;
                else if (m.metric === 'interactions') interactions += val;
                else if (m.metric === 'followers') followers += val;
            }
            return { reach, interactions, followers };
        };

        const firstPageSums = processItems(firstPage.items);
        totalReach += firstPageSums.reach;
        totalInteractions += firstPageSums.interactions;
        totalFollowers += firstPageSums.followers;

        if (firstPage.totalPages > 1) {
            const promises = [];
            for (let p = 2; p <= firstPage.totalPages; p++) {
                promises.push(
                    pb.collection('instagram_daily_metrics').getList(p, batchSize, {
                        filter: filter,
                        requestKey: null,
                        fields: 'metric,value'
                    })
                );
            }
            const results = await Promise.all(promises);
            for (const res of results) {
                const sums = processItems(res.items);
                totalReach += sums.reach;
                totalInteractions += sums.interactions;
                totalFollowers += sums.followers;
            }
        }

        // Construct the condensed metrics list
        const condensedMetrics = [
            { metric: 'reach', value: totalReach },
            { metric: 'interactions', value: totalInteractions },
            { metric: 'followers', value: totalFollowers }
        ];

        res.json({
            metrics: condensedMetrics
        });

    } catch (error) {
        console.error('Aggregate dashboard error:', error);
        res.status(500).json({ error: error.message, metrics: [] });
    }
});

router.get('/:country/:platform', async (req, res) => {
    try {
        const { country, platform } = req.params;
        let { startDate, endDate } = req.query;

        console.log(`Getting dashboard data for ${country}/${platform}, range: ${startDate} to ${endDate}`);

        // Normalize platform (frontend passes 'Instagram', 'TikTok' etc in capitalized form sometimes?)
        // PlatformView passes 'Instagram'.
        const socialNetwork = platform.toLowerCase();

        let dateFilter = '';
        if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
            try {
                const startDateObj = new Date(startDate);
                const endDateObj = new Date(endDate);
                
                if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
                    const start = startDateObj.toISOString();
                    endDateObj.setUTCHours(23, 59, 59, 999);
                    const end = endDateObj.toISOString();
                    dateFilter = pb.filter(' && date >= {:start} && date <= {:end}', { start, end });
                }
            } catch (e) {
                console.error('Invalid date format received:', { startDate, endDate });
            }
        }



        let metrics = [];
        let content = [];

        if (socialNetwork === 'tiktok') {
            const metricsFilter = pb.filter('country = {:country} && platform = {:socialNetwork}', { country, socialNetwork }) + dateFilter;
            // Use country filter if available, otherwise just date filter for TikTok temporarily
            const contentFilter = pb.filter('country = {:country}', { country }) + dateFilter;

            const [metricsResult, contentResult] = await Promise.all([
                pb.collection('tiktok_daily_metrics').getFullList({
                    filter: metricsFilter,
                    sort: 'date',
                    requestKey: null
                }).catch(e => {
                    console.log('Error fetching tiktok metrics:', e.message);
                    return [];
                }),
                pb.collection('tiktok_content').getList(1, 1000, {
                    filter: contentFilter,
                    sort: '-date',
                    requestKey: null
                }).then(res => res.items).catch(e => {
                    console.log('Error fetching tiktok content:', e.message);
                    return [];
                })
            ]);

            metrics = metricsResult;
            content = contentResult;

            // Normalize Content for Frontend
            content = content.map(c => ({
                ...c,
                date: c.date, // Standardized date field
                platform_type: 'video', // Enforce type
                social_network: 'tiktok',
                reach: c.views, // Use views as reach proxy? Or keep separate?
                // Frontend expects reach, likes, comments, shares
            }));

        } else if (socialNetwork === 'facebook') {
            const metricsFilter = pb.filter('country = {:country}', { country }) + dateFilter;
            const contentFilter = pb.filter('country = {:country}', { country }) + dateFilter;

            const [metricsResult, contentResult] = await Promise.all([
                pb.collection('facebook_daily_metrics').getFullList({
                    filter: metricsFilter,
                    sort: 'date',
                    requestKey: null
                }).catch(e => {
                    console.log('Error fetching facebook metrics:', e.message);
                    return [];
                }),
                pb.collection('facebook_content').getList(1, 1000, {
                    filter: contentFilter,
                    sort: '-date',
                    requestKey: null
                }).then(res => res.items).catch(e => {
                    console.log('Error fetching facebook content:', e.message);
                    return [];
                })
            ]);

            metrics = metricsResult;
            content = contentResult;

            // Normalize Content
            content = content.map(c => ({
                ...c,
                social_network: 'facebook'
            }));

        } else if (socialNetwork === 'youtube') {
            const metricsFilter = pb.filter('country = {:country} && platform = "youtube"', { country }) + dateFilter;
            const contentFilter = pb.filter('country = {:country}', { country }) + dateFilter;

            const [metricsResult, contentResult] = await Promise.all([
                pb.collection('youtube_daily_metrics').getFullList({
                    filter: metricsFilter,
                    sort: 'date',
                    requestKey: null
                }).catch(e => {
                    console.log('Error fetching youtube metrics:', e.message);
                    return [];
                }),
                pb.collection('youtube_content').getList(1, 1000, {
                    filter: contentFilter,
                    sort: '-date',
                    requestKey: null
                }).then(res => res.items).catch(e => {
                    console.log('Error fetching youtube content:', e.message);
                    return [];
                })
            ]);

            metrics = metricsResult;
            content = contentResult;

            // Normalize Content
            content = content.map(c => ({
                ...c,
                social_network: 'youtube',
                platform_type: 'video'
            }));

        } else {
            // Instagram (Default)
            const metricsFilter = pb.filter('country = {:country} && platform = {:socialNetwork}', { country, socialNetwork }) + dateFilter;
            const contentFilter = pb.filter('country = {:country} && social_network = {:socialNetwork}', { country, socialNetwork }) + dateFilter;

            const [metricsResult, contentResult] = await Promise.all([
                pb.collection('instagram_daily_metrics').getFullList({
                    filter: metricsFilter,
                    sort: 'date',
                    requestKey: null
                }),
                pb.collection('instagram_content').getList(1, 1000, {
                    filter: contentFilter,
                    sort: '-date',
                    requestKey: null
                })
            ]);

            metrics = metricsResult;
            content = contentResult.items;
        }

        res.json({
            metrics,
            content
        });

    } catch (error) {
        console.error('Platform dashboard error:', error);
        res.status(500).json({ error: error.message, metrics: [], content: [] });
    }
});

module.exports = router;
