const express = require('express');
const multer = require('multer');
const { pb } = require('../services/db');
const { parseInstagramCSV, parseTikTokCSV, parseFacebookCSV } = require('../services/parser');

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
    // Check if we already imported today? Prevent duplicates?

    // We filter by import_date (start of day) to avoid duplicates for the same day
    const today = new Date().toISOString().split('T')[0];

    const recordData = {
        platform: 'instagram',
        country: country,
        import_date: new Date().toISOString(),
        gender_age_data: JSON.stringify(data.gender_age),
        cities_data: JSON.stringify(data.cities),
        countries_data: JSON.stringify(data.countries)
    };

    // Check for existing record for today and country
    // Note: PocketBase date filtering can be tricky. Using >= today 00:00:00
    const existing = await pb.collection('instagram_audience_demographics').getList(1, 1, {
        filter: `platform = 'instagram' && country = "${country}" && import_date >= "${today} 00:00:00"`,
        requestKey: null
    });

    if (existing.items.length > 0) {
        // Update existing record
        await pb.collection('instagram_audience_demographics').update(existing.items[0].id, recordData, { requestKey: null });
    } else {
        // Create new record
        await pb.collection('instagram_audience_demographics').create(recordData, { requestKey: null });
    }
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
            const BATCH_SIZE = 50;
            const items = result.data;

            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const chunk = items.slice(i, i + BATCH_SIZE);
                const originalIds = chunk.map(item => item.id).filter(Boolean);

                if (originalIds.length === 0) continue;

                try {
                    // 1. Check existence in batch
                    // Construct filter: (original_id="id1" || original_id="id2" ...) && country="..."
                    const idFilter = originalIds.map(id => `original_id = "${id}"`).join(' || ');
                    const fullFilter = `(${idFilter}) && country = "${country}" && social_network = "instagram"`;

                    let existingItems = [];
                    if (idFilter) {
                        try {
                            existingItems = await pb.collection('instagram_content').getFullList({
                                filter: fullFilter,
                                requestKey: null,
                                fields: 'id,original_id' // Optimization: Fetch only needed fields
                            });
                        } catch (err) {
                            console.error('Error fetching existing records batch:', err.message);
                            // Fallback is handled implicitly (existingItems empty -> everything treated as new)
                        }
                    }

                    const existingMap = new Map();
                    existingItems.forEach(rec => {
                        existingMap.set(rec.original_id, rec);
                    });

                    // 2. Process chunk in parallel
                    await Promise.all(chunk.map(async (item) => {
                        try {
                            const contentType = mapPlatformToType(item.platform);

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
                                status: item.status,
                                author: item.author // Save author/username
                            };

                            const existingRecord = existingMap.get(item.id);

                            if (existingRecord) {
                                await pb.collection('instagram_content').update(existingRecord.id, recordData, { requestKey: null });
                            } else {
                                await pb.collection('instagram_content').create(recordData, { requestKey: null });
                            }
                            savedCount++;
                        } catch (err) {
                            console.error(`Error saving content item ${item.id}:`, err.message, err.data);
                            errors.push({ id: item.id, error: err.message, details: err.data });
                        }
                    }));
                } catch (batchErr) {
                    console.error(`Critical error processing batch starting at index ${i}:`, batchErr);
                    errors.push({ error: `Batch processing failed: ${batchErr.message}` });
                }
            }
        } else if (result.type === 'metric') {
            // Process metrics in batches to avoid N+1 slow down
            const BATCH_SIZE = 10;
            for (let i = 0; i < result.data.length; i += BATCH_SIZE) {
                const chunk = result.data.slice(i, i + BATCH_SIZE);

                // Optimization: Fetch existing records for the whole batch using Date Range (safer than exact timestamp matching)
                const dates = chunk.map(item => item.date).sort();
                let existingRecords = [];
                let batchFetchFailed = false;

                let minDate = '';
                let maxDate = '';

                if (dates.length > 0) {
                    minDate = dates[0];
                    maxDate = dates[dates.length - 1];

                    try {
                        // Remove platform filter to catch case mismatches (e.g. 'Instagram' vs 'instagram')
                        // Since we are in 'instagram_daily_metrics', strictly speaking we don't need to filter by platform if it's the only one.
                        // However, let's keep it safe but maybe removing it blindly is better if data is dirty.
                        // DECISION: Remove platform filter to be maximally robust.
                        existingRecords = await pb.collection('instagram_daily_metrics').getFullList({
                            filter: `country = "${country}" && date >= "${minDate} 00:00:00.000Z" && date <= "${maxDate} 23:59:59.999Z"`,
                            requestKey: null
                        });
                    } catch (batchErr) {
                        console.error('Error fetching batch metrics:', batchErr.message);
                        batchFetchFailed = true;
                    }
                }

                if (existingRecords.length > 0) {
                    console.log(`[DEBUG] Found ${existingRecords.length} existing records for batch.`);
                    console.log(`[DEBUG] Sample Exists: ${existingRecords[0].date} (${existingRecords[0].metric})`);
                } else {
                    console.log(`[DEBUG] No existing records found for filter range: ${minDate} to ${maxDate}`);
                }

                const existingMap = new Map();
                if (!batchFetchFailed) {
                    for (const record of existingRecords) {
                        // Normalize DB date to YYYY-MM-DD (Handle T or space separator safely)
                        const dateKey = record.date.substring(0, 10);
                        // console.log(`[DEBUG] Raw DB Date: ${record.date} -> Key: ${dateKey}`);
                        // Robust Key: Lowercase metric
                        const key = `${dateKey}_${record.metric.toLowerCase()}`;
                        existingMap.set(key, record);
                        // console.log(`[DEBUG] Map key: ${key}`);
                    }
                }

                await Promise.all(chunk.map(async (item) => {
                    try {
                        // Search key: Lowercase metric
                        const key = `${item.date}_${item.metric.toLowerCase()}`;
                        let existingRecord = existingMap.get(key);

                        // Debugging removed to reduce noise once fixed, or keep minimal
                        // if (!existingRecord && i === 0) console.log(...)

                        // Fallback: Individual check if batch failed
                        if (batchFetchFailed) {
                            const existing = await pb.collection('instagram_daily_metrics').getList(1, 1, {
                                // Relaxed individual filter too
                                filter: `date >= "${item.date} 00:00:00.000Z" && date <= "${item.date} 23:59:59.999Z" && metric = "${item.metric}" && country = "${country}"`,
                                requestKey: null
                            });
                            if (existing.items.length > 0) {
                                existingRecord = existing.items[0];
                            }
                        }

                        const recordData = {
                            date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                            metric: item.metric,
                            value: item.value,
                            platform: 'instagram',
                            country: country
                        };

                        if (existingRecord) {
                            await pb.collection('instagram_daily_metrics').update(existingRecord.id, recordData, { requestKey: null });
                            // console.log(`[DEBUG] Updated: ${key}`);
                            savedCount++;
                        } else {
                            try {
                                await pb.collection('instagram_daily_metrics').create(recordData, { requestKey: null });
                                console.log(`[DEBUG] Created New: ${key}`);
                                savedCount++;
                                // Optimistically update map for next item in batch?
                                // existingMap.set(key, { ...recordData, id: 'temp' }); 
                            } catch (createErr) {
                                // Handle Unique Constraint Violation (Race condition or previous batch miss)
                                if (createErr.status === 400) {
                                    // console.log(`[DEBUG] Unique constraint hit for ${key}, trying update...`);
                                    try {
                                        // Fetch actual ID
                                        const found = await pb.collection('instagram_daily_metrics').getFirstListItem(`date = "${recordData.date}" && metric = "${recordData.metric}" && country = "${country}"`, { requestKey: null });
                                        await pb.collection('instagram_daily_metrics').update(found.id, recordData, { requestKey: null });
                                        savedCount++;
                                    } catch (fetchErr) {
                                        console.error(`Failed to recover from unique violation for ${key}:`, fetchErr.message);
                                        errors.push({ date: item.date, metric: item.metric, error: createErr.message });
                                    }
                                } else {
                                    throw createErr;
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`Error saving metric ${item.metric} for ${item.date}:`, err.message);
                        errors.push({ date: item.date, metric: item.metric, error: err.message });
                    }
                }));
            }
        } else if (result.type === 'demographics') {
            try {
                savedCount = await updateAudienceDemographics(result.data, country);
            } catch (err) {
                console.error('Error saving audience data:', err.message);
                errors.push({ error: err.message, type: 'demographics' });
            }
        } else {
            return res.status(400).json({ error: result.message || 'Unknown file type or failed to parse' });
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

        const { country } = req.body;
        if (!country) return res.status(400).json({ error: 'Country is required' });

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
            const existingRecords = await pb.collection('tiktok_content').getFullList({
                filter: `country = "${country}"`,
                requestKey: null
            });

            const existingRecordsMap = new Map();
            for (const record of existingRecords) {
                existingRecordsMap.set(record.original_id, record);
            }

            const itemsToCreate = [];
            const itemsToUpdate = [];

            for (const item of result.data) {
                const recordData = {
                    original_id: item.original_id,
                    title: item.title,
                    permalink: item.permalink,
                    post_time: item.post_time,
                    likes: item.likes,
                    comments: item.comments,
                    shares: item.shares,
                    views: item.views,
                    country: country,
                    date: item.date_published ? new Date(item.date_published + 'T12:00:00.000Z').toISOString() : new Date().toISOString(),
                    author: item.author || '',
                    social_network: 'tiktok',
                    platform_type: 'video'
                };

                const existingRecord = existingRecordsMap.get(item.original_id);

                if (existingRecord) {
                    itemsToUpdate.push({ id: existingRecord.id, data: recordData });
                } else {
                    itemsToCreate.push(recordData);
                }
            }

            for (const item of itemsToCreate) {
                try {
                    await pb.collection('tiktok_content').create(item, { requestKey: null });
                    savedCount++;
                } catch (e) {
                    console.error('Error creating tiktok content:', e.message);
                    errors.push(e.message);
                }
            }

            for (const item of itemsToUpdate) {
                try {
                    await pb.collection('tiktok_content').update(item.id, item.data, { requestKey: null });
                    savedCount++;
                } catch (e) {
                    console.error('Error updating tiktok content:', e.message);
                    errors.push(e.message);
                }
            }
        } else if (result.type === 'metric') {
            // result.data is array of objects { date, metric, value }

            // Process in batches to avoid overwhelming the server but gain parallelism
            const BATCH_SIZE = 50;
            for (let i = 0; i < result.data.length; i += BATCH_SIZE) {
                const batch = result.data.slice(i, i + BATCH_SIZE);

                try {
                    // Optimization: Fetch existing records for the batch date range
                    const dates = batch.map(item => item.date).sort();
                    const minDate = dates[0];
                    const maxDate = dates[dates.length - 1];

                    // Check if we have valid dates
                    if (!minDate || !maxDate) continue;

                    const existingRecords = await pb.collection('tiktok_daily_metrics').getFullList({
                        filter: `country = "${country}" && date >= "${minDate} 00:00:00.000Z" && date <= "${maxDate} 23:59:59.999Z"`,
                        requestKey: null
                    });

                    const existingMap = new Map();
                    for (const rec of existingRecords) {
                        // DB date is ISO string, e.g. "2023-01-01T12:00:00.000Z"
                        // Input date is "YYYY-MM-DD"
                        // We extract the date part from DB record to match input
                        const dateKey = rec.date.split('T')[0]; // "2023-01-01"
                        const key = `${dateKey}_${rec.metric}`;
                        existingMap.set(key, rec);
                    }

                    await Promise.all(batch.map(async (item) => {
                        try {
                            const key = `${item.date}_${item.metric}`;
                            const existing = existingMap.get(key);

                            const recordData = {
                                date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                                metric: item.metric,
                                value: item.value,
                                platform: 'tiktok',
                                country: country // Added country isolation
                            };

                            if (existing) {
                                await pb.collection('tiktok_daily_metrics').update(existing.id, recordData, { requestKey: null });
                                savedCount++;
                            } else {
                                try {
                                    await pb.collection('tiktok_daily_metrics').create(recordData, { requestKey: null });
                                    savedCount++;
                                } catch (createErr) {
                                    if (createErr.status === 400) {
                                        const found = await pb.collection('tiktok_daily_metrics').getFirstListItem(`date = "${recordData.date}" && metric = "${recordData.metric}" && country = "${country}"`, { requestKey: null });
                                        await pb.collection('tiktok_daily_metrics').update(found.id, recordData, { requestKey: null });
                                        savedCount++;
                                    } else {
                                        throw createErr;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Error saving tiktok metric:', e.message);
                            errors.push(e.message);
                        }
                    }));
                } catch (batchError) {
                    console.error('Batch processing error:', batchError.message);
                    errors.push(`Batch error: ${batchError.message}`);
                }
            }
        } else if (result.type === 'demographics') {
            // result.subtype = 'gender' | 'territory'
            // result.data = object
            try {
                const today = new Date().toISOString().split('T')[0];
                const recordData = {
                    type: result.subtype,
                    data: JSON.stringify(result.data),
                    date_reference: new Date().toISOString(),
                    country: country
                };

                // Check duplicate for today
                const existing = await pb.collection('tiktok_audience_demographics').getList(1, 1, {
                    filter: `type = "${result.subtype}" && country = "${country}" && date_reference >= "${today} 00:00:00"`,
                    requestKey: null
                });

                if (existing.items.length > 0) {
                    await pb.collection('tiktok_audience_demographics').update(existing.items[0].id, recordData, { requestKey: null });
                } else {
                    await pb.collection('tiktok_audience_demographics').create(recordData, { requestKey: null });
                }
                savedCount = 1;
            } catch (e) {
                console.error('Error saving demographics:', e.message);
                errors.push(e.message);
            }
        } else if (result.type === 'activity') {
            // result.data is raw rows array
            try {
                const today = new Date().toISOString().split('T')[0];
                const recordData = {
                    type: 'activity',
                    data: JSON.stringify(result.data),
                    date_reference: new Date().toISOString(),
                    country: country
                };

                // Check duplicate for today
                const existing = await pb.collection('tiktok_audience_demographics').getList(1, 1, {
                    filter: `type = "activity" && country = "${country}" && date_reference >= "${today} 00:00:00"`,
                    requestKey: null
                });

                if (existing.items.length > 0) {
                    await pb.collection('tiktok_audience_demographics').update(existing.items[0].id, recordData, { requestKey: null });
                } else {
                    await pb.collection('tiktok_audience_demographics').create(recordData, { requestKey: null });
                }
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

router.post('/facebook', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { country } = req.body;
        if (!country) {
            return res.status(400).json({ error: 'Country is required' });
        }

        const buffer = req.file.buffer;
        // Normalize filename for better detection (remove accents)
        const originalFilename = req.file.originalname;
        const filename = originalFilename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        console.log(`Processing Facebook file: ${originalFilename} (normalized: ${filename}) for country: ${country}`);

        const result = await parseFacebookCSV(buffer, filename);
        let savedCount = 0;
        let errors = [];

        if (result.type === 'unknown') {
            return res.status(400).json({ error: result.message || 'Formato de arquivo Facebook desconhecido' });
        }

        if (result.type === 'metric') {
            try {
                // Pre-fetch existing metrics to avoid N+1 queries
                const dates = result.data.map(d => d.date).sort();
                let existingItems = [];

                if (dates.length > 0) {
                    const minDate = dates[0];
                    const maxDate = dates[dates.length - 1];

                    // Fetch existing records for the date range
                    // Relaxed Filter: Removing 'platform="facebook"' just in case
                    existingItems = await pb.collection('facebook_daily_metrics').getFullList({
                        filter: `country = "${country}" && date >= "${minDate}" && date <= "${maxDate}"`,
                        requestKey: null
                    });
                }

                const existingMap = new Map();
                for (const item of existingItems) {
                    // BUG FIX: Normalize DB date (YYYY-MM-DD) to match parsed date key
                    // AND Lowercase metric
                    const dateKey = item.date.substring(0, 10);
                    existingMap.set(`${dateKey}_${item.metric.toLowerCase()}`, item);
                }

                // Process in batches
                const BATCH_SIZE = 50;
                for (let i = 0; i < result.data.length; i += BATCH_SIZE) {
                    const chunk = result.data.slice(i, i + BATCH_SIZE);

                    const chunkPromises = chunk.map(async (item) => {
                        try {
                            const key = `${item.date}_${item.metric.toLowerCase()}`;
                            const existing = existingMap.get(key);

                            if (existing) {
                                await pb.collection('facebook_daily_metrics').update(existing.id, {
                                    value: item.value,
                                    country: country
                                }, { requestKey: null });
                                return { success: true };
                            } else {
                                try {
                                    await pb.collection('facebook_daily_metrics').create({
                                        platform: 'facebook',
                                        date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                                        metric: item.metric,
                                        value: item.value,
                                        country: country
                                    }, { requestKey: null });
                                    return { success: true };
                                } catch (createErr) {
                                    if (createErr.status === 400) {
                                        const found = await pb.collection('facebook_daily_metrics').getFirstListItem(`date ~ "${item.date}" && metric = "${item.metric}" && country = "${country}"`, { requestKey: null });
                                        await pb.collection('facebook_daily_metrics').update(found.id, { value: item.value, country }, { requestKey: null });
                                        return { success: true };
                                    } else {
                                        throw createErr;
                                    }
                                }
                            }
                        } catch (e) {
                            const errorDetail = e.response ? JSON.stringify(e.response.data) : e.message;
                            console.error('Error saving facebook metric:', errorDetail);
                            return { success: false, error: `Metric Error (${item.date}): ${errorDetail}` };
                        }
                    });

                    const results = await Promise.all(chunkPromises);
                    results.forEach(res => {
                        if (res.success) savedCount++;
                        else errors.push(res.error);
                    });
                }
            } catch (err) {
                console.error('Error in batched facebook metric upload:', err);
                errors.push(`Global Batch Error: ${err.message}`);
            }
        } else if (result.type === 'content') {
            const BATCH_SIZE = 50;
            const items = result.data;

            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const chunk = items.slice(i, i + BATCH_SIZE);
                const originalIds = chunk.map(item => item.id).filter(Boolean);

                if (originalIds.length === 0) continue;

                try {
                    // 1. Check existence in batch
                    const filterExpr = originalIds.map(id => `original_id = "${id}"`).join(' || ');

                    let existingItems = [];
                    // PocketBase filter length limit might be hit if ids are very long, but 50 items should be safe.
                    if (filterExpr) {
                        existingItems = await pb.collection('facebook_content').getFullList({
                            filter: filterExpr,
                            requestKey: null,
                            fields: 'id,original_id' // optimization: select only needed fields
                        });
                    }

                    const existingMap = new Map();
                    existingItems.forEach(rec => {
                        existingMap.set(rec.original_id, rec);
                    });

                    // 2. Prepare operations
                    const promises = chunk.map(async (item) => {
                        try {
                            const payload = {
                                original_id: item.id,
                                title: item.title,
                                permalink: item.permalink,
                                platform_type: item.platform, // 'social' or 'video'
                                social_network: 'facebook',
                                country: country,
                                date: (() => {
                                    if (!item.date) return new Date().toISOString();
                                    // Extract YYYY-MM-DD portion only (strip any time already embedded)
                                    const datePart = item.date.split('T')[0];
                                    const parsed = new Date(datePart + 'T12:00:00.000Z');
                                    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
                                })(),
                                posting_time: item.posting_time,
                                reach: item.reach,
                                likes: item.likes,
                                shares: item.shares,
                                comments: item.comments,
                                saved: item.saved,
                                views: item.views,
                                clicks: item.clicks,
                                duration: item.duration,
                                virality: item.virality,
                                status: item.status,
                                author: item.author,
                                media_type: item.platform
                            };

                            const existingRecord = existingMap.get(item.id);
                            if (existingRecord) {
                                await pb.collection('facebook_content').update(existingRecord.id, payload, { requestKey: null });
                            } else {
                                await pb.collection('facebook_content').create(payload, { requestKey: null });
                            }
                            savedCount++;
                        } catch (e) {
                            const errorDetail = e.response ? JSON.stringify(e.response.data) : e.message;
                            console.error('Error saving facebook content:', errorDetail);
                            const dateInfo = item.date ? `(date: ${item.date})` : '(no date)';
                            errors.push(`Content Error (${item.id}): ${errorDetail} ${dateInfo}`);
                        }
                    });

                    // 3. Execute in parallel
                    await Promise.all(promises);

                } catch (batchError) {
                    console.error('Batch processing error:', batchError);
                    errors.push(`Batch Error (indices ${i}-${i + BATCH_SIZE}): ${batchError.message}`);
                }
            }
        } else if (result.type === 'audience') {
            try {
                const data = result.data;
                const today = new Date().toISOString().split('T')[0];
                const recordData = {
                    platform: 'facebook',
                    import_date: new Date().toISOString(),
                    country_filter: country, // Store which audience this belongs to if applicable, or just country label
                    gender_age: data.gender_age,
                    cities: data.cities,
                    countries: data.countries
                };

                // Check duplicate for today
                const existing = await pb.collection('facebook_audience_demographics').getList(1, 1, {
                    filter: `platform = "facebook" && country_filter = "${country}" && import_date >= "${today} 00:00:00"`,
                    requestKey: null
                });

                if (existing.items.length > 0) {
                    await pb.collection('facebook_audience_demographics').update(existing.items[0].id, recordData, { requestKey: null });
                } else {
                    await pb.collection('facebook_audience_demographics').create(recordData, { requestKey: null });
                }
                savedCount = 1;
            } catch (e) {
                const errorDetail = e.response ? JSON.stringify(e.response.data) : e.message;
                console.error('Error saving facebook audience:', errorDetail);
                errors.push(errorDetail);
            }
        }

        res.json({
            success: true,
            type: result.type,
            processed: savedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Facebook Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
