const express = require('express');
const { pb } = require('../services/db');
const router = express.Router();

/**
 * GET /:country/:platform
 * Query: ?startDate=2025-01-01&endDate=2025-01-31
 */
router.get('/:country/:platform', async (req, res) => {
    try {
        const { country, platform } = req.params;
        const { startDate, endDate } = req.query;
        const targetPlatform = platform.toLowerCase();

        // Date Filter Construction
        let dateFilterMetrics = '';
        let dateFilterContent = '';

        if (startDate) {
            dateFilterMetrics += ` && date >= "${startDate} 00:00:00"`;
            dateFilterContent += ` && date >= "${startDate} 00:00:00"`;
        }
        if (endDate) {
            dateFilterMetrics += ` && date <= "${endDate} 23:59:59"`;
            dateFilterContent += ` && date <= "${endDate} 23:59:59"`;
        }

        // Fetch Metrics
        const metricsPromise = pb.collection('instagram_daily_metrics').getFullList({
            filter: `country = "${country}" && platform = "${targetPlatform}"${dateFilterMetrics}`,
            sort: 'date'
        });

        // Fetch Content
        // Using optimal filter logic
        const contentPromise = pb.collection('instagram_content').getFullList({
            filter: `country = "${country}" && social_network = "${targetPlatform}"${dateFilterContent}`,
            sort: '-date',
            limit: 50 // Keep limit reasonable for performance
        });

        const [metrics, content] = await Promise.all([metricsPromise, contentPromise]);

        res.json({
            metrics,
            content
        });

    } catch (err) {
        console.error('Dashboard data fetch error:', err);
        res.status(500).json({ error: err.message, metrics: [], content: [] });
    }
});

/**
 * GET /aggregate/:country
 * For the main dashboard view (all platforms)
 */
router.get('/aggregate/:country', async (req, res) => {
    try {
        const { country } = req.params;
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        if (startDate) dateFilter += ` && date >= "${startDate} 00:00:00"`;
        if (endDate) dateFilter += ` && date <= "${endDate} 23:59:59"`;

        const metrics = await pb.collection('instagram_daily_metrics').getFullList({
            filter: `country = "${country}"${dateFilter}`,
            sort: 'date'
        });

        res.json({ metrics });

    } catch (err) {
        console.error('Aggregate data fetch error:', err);
        res.status(500).json({ error: err.message, metrics: [] });
    }
});

module.exports = router;
