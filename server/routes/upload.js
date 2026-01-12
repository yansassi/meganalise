const express = require('express');
const multer = require('multer');
const { pb } = require('../services/db');
const { parseInstagramCSV, parseTikTokCSV } = require('../services/parser');

const router = express.Router();
const upload = multer(); // Memory storage

// Helper to map parser platform to DB type
const mapPlatformToType = (platform) => {
    switch (platform) {
        case 'story': return 'story';
        case 'video': return 'video';
        case 'social':
        default: return 'social';
    }
};

const updateAudienceDemographics = async (data, country) => {
    // 1. Check if record exists for this country/platform (assuming 1 record per country OR daily snapshots?)
    // Decision: Keep history. Create new record with date.

    // Check if we already imported today? Prevent duplicates?
    // Let's just create a snapshot. 

    const recordData = {
        platform: 'instagram',
        country: country,
        import_date: new Date().toISOString(),
        gender_age_data: JSON.stringify(data.gender_age),
        cities_data: JSON.stringify(data.cities),
        countries_data: JSON.stringify(data.countries)
    };

    await pb.collection('instagram_audience_demographics').create(recordData, { requestKey: null });
    return 1;
};

router.post('/instagram', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { country } = req.body;
        if (!country) {
            return res.status(400).json({ error: 'Country is required' });
        }

        const buffer = req.file.buffer;
        const filename = req.file.originalname;

        console.log(`Processing file: ${filename} for country: ${country}`);

        const result = await parseInstagramCSV(buffer, filename);
        let savedCount = 0;
        let errors = [];

        if (result.type === 'ignored') {
            return res.json({ success: true, type: 'ignored', message: 'Arquivo processado (ignorado)' });
        }

        if (result.type === 'content') {
            for (const item of result.data) {
                try {
                    // Check if exists
                    const contentType = mapPlatformToType(item.platform);

                    // Try to find existing record
                    // Filter by original_id, country, and social_network (instagram)
                    const existing = await pb.collection('instagram_content').getList(1, 1, {
                        filter: `original_id = "${item.id}" && country = "${country}" && social_network = "instagram"`,
                        requestKey: null // Disable auto-cancellation
                    });

                    const recordData = {
                        original_id: item.id,
                        title: item.title,
                        permalink: item.permalink,
                        platform_type: contentType, // Matched to frontend expectation
                        social_network: 'instagram',
                        country: country,
                        date: item.date ? new Date(item.date + 'T12:00:00.000Z').toISOString() : new Date().toISOString(),
                        posting_time: item.posting_time,
                        reach: item.reach,
                        likes: item.likes,
                        shares: item.shares,
                        comments: item.comments,
                        saved: item.saved,
                        views: item.views,
                        duration: item.duration,
                        virality_score: parseFloat(item.virality), // Matched to frontend expectation
                        virality_score: parseFloat(item.virality), // Matched to frontend expectation
                        status: item.status,
                        author: item.author // Save author/username
                    };

                    if (existing.items.length > 0) {
                        await pb.collection('instagram_content').update(existing.items[0].id, recordData, { requestKey: null });
                    } else {
                        await pb.collection('instagram_content').create(recordData, { requestKey: null });
                    }
                    savedCount++;
                } catch (err) {
                    console.error(`Error saving content item ${item.id}:`, err.message, err.data);
                    errors.push({ id: item.id, error: err.message, details: err.data });
                }
            }
        } else if (result.type === 'metric') {
            for (const item of result.data) {
                try {
                    // Check if exists
                    const existing = await pb.collection('instagram_daily_metrics').getList(1, 1, {
                        filter: `date = "${item.date} 00:00:00.000Z" && metric = "${item.metric}" && country = "${country}" && platform = "instagram"`,
                        requestKey: null
                    });

                    // Note: PocketBase date fields might need specific formatting or handling
                    // Assuming 'date' field in PB is 'date' type.

                    const recordData = {
                        date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                        metric: item.metric,
                        value: item.value,
                        platform: 'instagram',
                        country: country
                    };

                    if (existing.items.length > 0) {
                        await pb.collection('instagram_daily_metrics').update(existing.items[0].id, recordData, { requestKey: null });
                    } else {
                        await pb.collection('instagram_daily_metrics').create(recordData, { requestKey: null });
                    }
                    savedCount++;
                } catch (err) {
                    console.error(`Error saving metric ${item.metric} for ${item.date}:`, err.message);
                    // Often metrics fail if date already exists due to unique constraints, 
                    // but we are checking first. 
                    // However, let's try to be robust.
                    // If filter fails, maybe format is different.

                    // Fallback to looser filter if initial check failed? 
                    // No, let's just log.
                    errors.push({ date: item.date, metric: item.metric, error: err.message });
                }
            }
        } else if (result.type === 'demographics') {
            try {
                savedCount = await updateAudienceDemographics(result.data, country);
            } catch (err) {
                console.error('Error saving audience data:', err.message);
                errors.push({ error: err.message, type: 'demographics' });
            }
        } else {
            return res.status(400).json({ error: 'Unknown file type or failed to parse' });
        }

        res.json({
            success: true,
            type: result.type,
            processed: result.data.length,
            saved: savedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Upload handler error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/tiktok', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { country } = req.body; // or default?
        const buffer = req.file.buffer;
        const filename = req.file.originalname;

        console.log(`Processing TikTok file: ${filename}`);

        const result = await parseTikTokCSV(buffer, filename);
        let savedCount = 0;
        let errors = [];

        if (result.type === 'unknown') {
            return res.status(400).json({ error: 'Unknown TikTok file format' });
        }

        if (result.type === 'content') {
            for (const item of result.data) {
                try {
                    const existing = await pb.collection('tiktok_content').getList(1, 1, {
                        filter: `original_id = "${item.original_id}" && country = "${country}"`,
                        requestKey: null
                    });

                    const recordData = {
                        original_id: item.original_id,
                        title: item.title,
                        permalink: item.permalink,
                        post_time: item.post_time, // String from CSV
                        // We should try to parse item.post_time to a real date object if possible, 
                        // but sticking to string if format is weird is safer for now.
                        likes: item.likes,
                        comments: item.comments,
                        shares: item.shares,
                        views: item.views,
                        country: country, // Added country
                        date: item.date_published ? new Date(item.date_published + 'T12:00:00.000Z').toISOString() : new Date().toISOString(), // Standardize to 'date' with noon time to prevent TZ rollback
                        author: item.author || '', // Standardize to 'author'
                        social_network: 'tiktok', // CRITICAL for frontend identification
                        platform_type: 'video' // Standardize platform type
                    };

                    if (existing.items.length > 0) {
                        await pb.collection('tiktok_content').update(existing.items[0].id, recordData, { requestKey: null });
                    } else {
                        await pb.collection('tiktok_content').create(recordData, { requestKey: null });
                    }
                    savedCount++;
                } catch (e) {
                    console.error('Error saving tiktok content:', e.message);
                    errors.push(e.message);
                }
            }
        } else if (result.type === 'metric') {
            // result.data is array of objects { date, metric, value }
            for (const item of result.data) {
                try {
                    const existing = await pb.collection('tiktok_daily_metrics').getList(1, 1, {
                        filter: `date = "${item.date} 00:00:00.000Z" && metric = "${item.metric}" && country = "${country}"`,
                        requestKey: null
                    });

                    const recordData = {
                        date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                        metric: item.metric,
                        value: item.value,
                        platform: 'tiktok',
                        country: country // Added country isolation
                    };

                    if (existing.items.length > 0) {
                        await pb.collection('tiktok_daily_metrics').update(existing.items[0].id, recordData, { requestKey: null });
                    } else {
                        await pb.collection('tiktok_daily_metrics').create(recordData, { requestKey: null });
                    }
                    savedCount++;
                } catch (e) {
                    console.error('Error saving tiktok metric:', e.message);
                    errors.push(e.message);
                }
            }
        } else if (result.type === 'demographics') {
            // result.subtype = 'gender' | 'territory'
            // result.data = object
            try {
                const recordData = {
                    type: result.subtype,
                    data: JSON.stringify(result.data),
                    date_reference: new Date().toISOString(),
                    country: country
                };
                // We can append or update today's record? Let's create new for history.
                await pb.collection('tiktok_audience_demographics').create(recordData, { requestKey: null });
                savedCount = 1;
            } catch (e) {
                console.error('Error saving demographics:', e.message);
                errors.push(e.message);
            }
        } else if (result.type === 'activity') {
            // result.data is raw rows array
            // Maybe store as a big blob for the day? Or ignore?
            // "Active followers" per hour.
            // Let's store as a metric with json value? Or new collection?
            // User plan said: "tiktok_audience_activity" or JSON in demographics.
            // Let's try to put in tiktok_audience_demographics with type='activity'
            try {
                const recordData = {
                    type: 'activity',
                    data: JSON.stringify(result.data),
                    date_reference: new Date().toISOString(),
                    country: country
                };
                await pb.collection('tiktok_audience_demographics').create(recordData, { requestKey: null });
                savedCount = 1;
            } catch (e) {
                console.error('Error saving activity:', e.message);
                errors.push(e.message);
            }
        }

        res.json({ success: true, saved: savedCount, errors: errors.length ? errors : undefined });

    } catch (error) {
        console.error('TikTok Upload parse error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
