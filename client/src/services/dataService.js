import { pb } from '../lib/pocketbase';

/**
 * Service to handle data persistence and transformation
 */
export const dataService = {
    /**
     * Converts raw data to JSON string and triggers download
     * This fulfills the requirement to "transform to .json" before saving
     * @param {Array|Object} data 
     * @param {string} filename 
     */
    downloadJSON(data, filename = 'data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        return jsonString; // Return for further processing if needed
    },

    /**
     * Batch creates or updates daily metrics in PocketBase
     * @param {Array} metrics - Array of normalized metric objects
     * @param {string} country - 'BR' or 'PY'
     */
    async saveDailyMetrics(metrics, country) {
        let savedCount = 0;
        const errors = [];

        // Sequential processing to manage rate limits and logic
        for (const item of metrics) {
            try {
                // Use range filter for date to avoid timezone/exact-match issues
                // We verify if a record exists for this date (entire day), metric, country, and platform
                const startOfDay = `${item.date} 00:00:00`;
                const endOfDay = `${item.date} 23:59:59`;

                const existing = await pb.collection('instagram_daily_metrics').getList(1, 50, {
                    filter: `date >= "${startOfDay}" && date <= "${endOfDay}" && metric = "${item.metric}" && country = "${country}" && platform = "instagram"`,
                    requestKey: null
                });

                const payload = {
                    date: item.date,
                    country,
                    platform: 'instagram',
                    metric: item.metric,
                    value: item.value
                };

                if (existing.items.length > 0) {
                    // Update the first found record
                    const firstId = existing.items[0].id;
                    await pb.collection('instagram_daily_metrics').update(firstId, {
                        value: item.value
                    }, { requestKey: null });

                    // Clean up any other duplicates found for the same day/metric
                    if (existing.items.length > 1) {
                        for (let i = 1; i < existing.items.length; i++) {
                            await pb.collection('instagram_daily_metrics').delete(existing.items[i].id, { requestKey: null });
                            console.log(`Deleted duplicate metric ${item.metric} for ${item.date} (ID: ${existing.items[i].id})`);
                        }
                    }
                } else {
                    // Create new record
                    await pb.collection('instagram_daily_metrics').create(payload, { requestKey: null });
                }
                savedCount++;
            } catch (err) {
                console.error(`Failed to save/update metric ${item.metric} on ${item.date}`, err);
                errors.push(err);
            }
        }

        return { savedCount, errors };
    },

    /**
     * Batch creates or updates content items in PocketBase
     */
    async saveContentItems(items, country) {
        let savedCount = 0;
        const errors = [];

        for (const item of items) {
            try {
                // Determine platform type enum
                let type = 'social';
                if (item.platform === 'video') type = 'video';
                if (item.platform === 'story') type = 'story'; // Persist story type

                // Check by original_id + country (assuming IDs might collide across countries if they are different accounts, but usually ID is unique)
                // Using valid PocketBase filter syntax
                const existing = await pb.collection('instagram_content').getList(1, 1, {
                    filter: `original_id = "${item.id}" && country = "${country}"`,
                    requestKey: null
                });

                const recordData = {
                    original_id: item.id,
                    title: item.title,
                    image_url: item.imageUrl,
                    platform_type: type,
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
                    // Update
                    await pb.collection('instagram_content').update(existing.items[0].id, recordData, { requestKey: null });
                } else {
                    // Create
                    await pb.collection('instagram_content').create(recordData, { requestKey: null });
                }
                savedCount++;
            } catch (err) {
                console.error(`Failed to save/update content ${item.title}`, err);
                errors.push(err);
            }
        }

        return { savedCount, errors };
    },

    /**
     * Fetches combined dashboard data for specific country
     */
    async getDashboardData(country) {
        try {
            // Fetch Metrics
            // Simplified fetch: get all records for this country. In production, filter by date range.
            const metricsRecords = await pb.collection('instagram_daily_metrics').getFullList({
                filter: `country = "${country}" && platform = "instagram"`,
                sort: 'date',
                requestKey: null
            });

            // Fetch Content
            const contentRecords = await pb.collection('instagram_content').getFullList({
                filter: `country = "${country}"`,
                sort: '-date',
                limit: 50,
                requestKey: null
            });

            return {
                metrics: metricsRecords,
                content: contentRecords
            };
        } catch (err) {
            console.error("Error fetching dashboard data", err);
            return { metrics: [], content: [] };
        }
    },

    /**
     * Saves audience demographics data to PocketBase
     * @param {Array} audienceData - Array of normalized audience objects
     */
    async saveAudienceData(audienceData) {
        let savedCount = 0;
        const errors = [];
        const importDate = new Date().toISOString();

        for (const item of audienceData) {
            try {
                const payload = {
                    platform: 'instagram',
                    import_date: importDate,
                    category: item.category,
                    subcategory: item.subcategory,
                    gender: item.gender,
                    value: item.value,
                    rank: item.rank
                };

                await pb.collection('instagram_audience_demographics').create(payload, { requestKey: null });
                savedCount++;
            } catch (err) {
                console.error(`Failed to save audience data ${item.category}/${item.subcategory}`, err);
                errors.push(err);
            }
        }

        return { savedCount, errors, importDate };
    },

    /**
     * Fetches audience demographics data
     * @param {string} category - Optional category filter ('age_gender', 'cities', 'countries', 'pages')
     * @param {string} importDate - Optional import date filter
     */
    async getAudienceData(category = null, importDate = null) {
        try {
            let filter = 'platform = "instagram"';

            if (category) {
                filter += ` && category = "${category}"`;
            }

            if (importDate) {
                filter += ` && import_date = "${importDate}"`;
            }

            const records = await pb.collection('instagram_audience_demographics').getFullList({
                filter,
                sort: category === 'cities' || category === 'pages' ? 'rank' : 'subcategory',
                requestKey: null
            });

            return records;
        } catch (err) {
            console.error("Error fetching audience data", err);
            return [];
        }
    },

    /**
     * Gets the latest import date for audience data
     */
    async getLatestAudienceImport() {
        try {
            const records = await pb.collection('instagram_audience_demographics').getList(1, 1, {
                filter: 'platform = "instagram"',
                sort: '-import_date',
                requestKey: null
            });

            return records.items.length > 0 ? records.items[0].import_date : null;
        } catch (err) {
            console.error("Error fetching latest import", err);
            return null;
        }
    },

    /**
     * Atualiza a imagem de capa de um conteúdo
     * @param {string} contentId - ID do conteúdo
     * @param {File} imageFile - Arquivo de imagem
     */
    async updateContentImage(contentId, imageFile) {
        try {
            const formData = new FormData();
            formData.append('image_file', imageFile);

            const result = await pb.collection('instagram_content').update(
                contentId,
                formData,
                { requestKey: null }
            );
            return result;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    /**
     * Obtém a URL da imagem de um conteúdo
     * Prioriza image_file (upload), senão usa image_url (URL externa)
     * @param {Object} item - Item de conteúdo
     */
    getContentImageUrl(item) {
        if (!item) return null;

        // Se tem arquivo uploadado, usa URL do PocketBase
        if (item.image_file) {
            return pb.getFileUrl(item, item.image_file);
        }

        // Senão, usa URL externa (compatibilidade)
        return item.image_url || null;
    }
};

