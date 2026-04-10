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

        let filter = `country = "${country}"`;
        if (startDate && endDate) {
            const start = new Date(startDate).toISOString();
            const endDateObj = new Date(endDate);
            endDateObj.setUTCHours(23, 59, 59, 999);
            const end = endDateObj.toISOString();
            filter += ` && date >= "${start}" && date <= "${end}"`;
        }

        // We paginate to avoid loading all records into memory at once
        // and perform aggregation in-memory.
        const batchSize = 500;
        let page = 1;
        let hasMore = true;

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

        while (hasMore) {
            const result = await pb.collection('instagram_daily_metrics').getList(page, batchSize, {
                filter: filter,
                requestKey: null,
                fields: 'metric,value' // Select only needed fields to save memory/bandwidth
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
        if (startDate && endDate) {
            // Ensure full ISO timestamp for accurate comparison if stored as ISO
            // Or just >= start and <= end
            const start = new Date(startDate).toISOString();
            const endDateObj = new Date(endDate);
            endDateObj.setUTCHours(23, 59, 59, 999);
            const end = endDateObj.toISOString();
            dateFilter = ` && date >= "${start}" && date <= "${end}"`;
        }


        let metrics = [];
        let content = [];

        if (socialNetwork === 'tiktok') {
            const metricsFilter = `country = "${country}" && platform = "${socialNetwork}"${dateFilter}`;
            // Use country filter if available, otherwise just date filter for TikTok temporarily
            const contentFilter = `country = "${country}"${dateFilter}`;

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
            const metricsFilter = `country = "${country}" && platform = "facebook"${dateFilter}`;
            const contentFilter = `country = "${country}"${dateFilter}`;

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
                social_network: 'facebook',
                platform_type: 'social' // Default to social post
            }));

        } else if (socialNetwork === 'youtube') {
            const metricsFilter = `country = "${country}" && platform = "youtube"${dateFilter}`;
            const contentFilter = `country = "${country}"${dateFilter}`;

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
            const metricsFilter = `country = "${country}" && platform = "${socialNetwork}"${dateFilter}`;
            const contentFilter = `country = "${country}" && social_network = "${socialNetwork}"${dateFilter}`;

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
