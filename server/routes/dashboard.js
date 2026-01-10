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
            const end = new Date(endDate).toISOString();
            filter += ` && date >= "${start}" && date <= "${end}"`;
        }

        // Fetch metrics from all platforms (currently just instagram logic implies all found)
        // Note: If we add more platforms, we might need to query different collections or same one if unified.
        // Assuming 'instagram_daily_metrics' for now or a unified metrics table? 
        // The upload route saves to 'instagram_daily_metrics'.
        // Does 'Dashboard.jsx' expect metrics from ALL platforms? Yes.
        // So we should query all known metric collections.

        // For now, only 'instagram_daily_metrics' exists in our scope.

        // We need to fetch ALL records matching filter, not just first page.
        // Use getFullList
        const metricsRecords = await pb.collection('instagram_daily_metrics').getFullList({
            filter: filter,
            requestKey: null
        });

        // The dashboard expects aggregated values (e.g. sum of reach across period).
        // Actually, Dashboard.jsx does the summing itself (lines 41-45).
        // So we just return the raw metrics list.

        res.json({
            metrics: metricsRecords
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
            const end = new Date(endDate).toISOString(); // This might be start of day?
            // To include the end date fully, we might need to adjust time?
            // Usually PB date comparison handles ISO strings.
            // Let's assume passed dates are correct boundaries or handled by frontend.
            dateFilter = ` && date >= "${start}" && date <= "${end}"`;
        }

        // 1. Fetch Metrics
        const metricsFilter = `country = "${country}" && platform = "${socialNetwork}"${dateFilter}`;
        const metrics = await pb.collection('instagram_daily_metrics').getFullList({
            filter: metricsFilter,
            sort: 'date',
            requestKey: null
        });

        // 2. Fetch Content
        // Content might need date filtering too
        const contentFilter = `country = "${country}" && social_network = "${socialNetwork}"${dateFilter}`;
        const content = await pb.collection('instagram_content').getFullList({
            filter: contentFilter,
            sort: '-date', // Newest first
            requestKey: null
        });

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
