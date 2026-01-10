const express = require('express');
const multer = require('multer');
const { parseInstagramCSV } = require('../services/parser');
const { pb } = require('../services/db');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/instagram', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { country } = req.body;
        if (!country) {
            return res.status(400).json({ error: 'Country is required' });
        }

        console.log(`Processing upload for ${country}: ${req.file.originalname}`);

        const result = await parseInstagramCSV(req.file.buffer, req.file.originalname);
        let savedCount = 0;
        let errors = [];

        if (result.type === 'metric') {
            const platform = 'instagram'; // normalized
            const metricName = result.metric;

            for (const item of result.data) {
                try {
                    const startOfDay = `${item.date} 00:00:00`;
                    const endOfDay = `${item.date} 23:59:59`;

                    // Check existing
                    const existing = await pb.collection('instagram_daily_metrics').getList(1, 50, {
                        filter: `date >= "${startOfDay}" && date <= "${endOfDay}" && metric = "${metricName}" && country = "${country}" && platform = "${platform}"`,
                    });

                    const payload = {
                        date: item.date,
                        country,
                        platform,
                        metric: metricName,
                        value: item.value
                    };

                    if (existing.items.length > 0) {
                        // Update
                        await pb.collection('instagram_daily_metrics').update(existing.items[0].id, { value: item.value });

                        // Dedup
                        if (existing.items.length > 1) {
                            for (let i = 1; i < existing.items.length; i++) {
                                await pb.collection('instagram_daily_metrics').delete(existing.items[i].id);
                            }
                        }
                    } else {
                        // Create
                        await pb.collection('instagram_daily_metrics').create(payload);
                    }
                    savedCount++;
                } catch (err) {
                    console.error(`Error saving metric ${item.date}`, err);
                    errors.push(err.message);
                }
            }
        } else if (result.type === 'content') {
            const platform = 'instagram';

            for (const item of result.data) {
                try {
                    let type = 'social';
                    if (item.platform === 'video') type = 'video';
                    if (item.platform === 'story') type = 'story';

                    // Check existing
                    const existing = await pb.collection('instagram_content').getList(1, 1, {
                        filter: `original_id = "${item.id}" && country = "${country}" && social_network = "${platform}"`,
                    });

                    const recordData = {
                        original_id: item.id,
                        title: item.title,
                        image_url: item.imageUrl,
                        platform_type: type,
                        social_network: platform,
                        date: item.date,
                        reach: item.reach,
                        likes: item.likes,
                        shares: item.shares,
                        comments: item.comments || 0,
                        virality_score: parseFloat(item.virality),
                        status: item.status,
                        country,
                        saved: item.saved || 0,
                        views: item.views || 0,
                        duration: item.duration || 0,
                        permalink: item.permalink || ''
                    };

                    if (existing.items.length > 0) {
                        await pb.collection('instagram_content').update(existing.items[0].id, recordData);
                    } else {
                        await pb.collection('instagram_content').create(recordData);
                    }
                    savedCount++;
                } catch (err) {
                    console.error(`Error saving content ${item.title}`, err);
                    errors.push(err.message);
                }
            }
        } else {
            return res.status(400).json({ error: 'Unknown CSV type', result });
        }

        res.json({ success: true, type: result.type, savedCount, errors });

    } catch (err) {
        console.error('Upload handler error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
