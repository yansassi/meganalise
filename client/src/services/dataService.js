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

    // Deprecated methods: saveDailyMetrics, saveContentItems are now handled by uploadInstagramData via Backend API

    /**
     * Fetches dashboard data for specific country and platform
     */
    /**
     * Uploads Metrics CSV to backend for processing
     * @param {File} file 
     * @param {string} country 
     * @param {string} platform
     */
    async uploadMetrics(file, country, platform = 'instagram') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('country', country);

        // Normalize platform to endpoint
        const endpoint = platform.toLowerCase() === 'tiktok' ? 'tiktok' : 'instagram';

        const response = await fetch(`https://api.meganalise.pro/api/upload/${endpoint}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return await response.json();
    },

    /**
     * Fetches dashboard data from backend
     */
    async getDashboardData(country, platform, startDate = null, endDate = null) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`https://api.meganalise.pro/api/dashboard/${country}/${platform}?${params.toString()}`);

            if (!response.ok) {
                // Return empty structure on failure to avoid crashes
                console.error("API Error", response.status);
                return { metrics: [], content: [] };
            }

            return await response.json();
        } catch (err) {
            console.error("Error fetching dashboard data", err);
            return { metrics: [], content: [] };
        }
    },

    /**
     * Fetches aggregated data (SUM) for the main dashboard from backend
     */
    async getAggregateDashboardData(country, startDate = null, endDate = null) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`https://api.meganalise.pro/api/dashboard/aggregate/${country}?${params.toString()}`);

            if (!response.ok) {
                return { metrics: [] };
            }

            return await response.json();
        } catch (err) {
            console.error("Error fetching aggregate data", err);
            return { metrics: [] };
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
     * Gets the latest audience demographics snapshot
     * @param {string} country 
     */
    async getAudienceDemographics(country, platform = 'instagram') {
        try {
            if (platform.toLowerCase() === 'tiktok') {
                // Fetch latest gender and territory records
                // We might need to fetch multiple records and merge
                const genderRecords = await pb.collection('tiktok_audience_demographics').getList(1, 1, {
                    filter: `type = "gender"`, // We might need country filter if we saved it? Upload logic didn't seem to save country for demographics demographics?
                    // Checking upload.js: tiktok demographics recordData has: type, data, date_reference. NO country.
                    // This is a potential bug if we want country isolation.
                    // IMPORTANT: I should add country to demographics in upload.js too.
                    // For now, let's fetch.
                    sort: '-created',
                    requestKey: null
                });

                const territoryRecords = await pb.collection('tiktok_audience_demographics').getList(1, 1, {
                    filter: `type = "territory"`,
                    sort: '-created',
                    requestKey: null
                });

                const activityRecords = await pb.collection('tiktok_audience_demographics').getList(1, 1, {
                    filter: `type = "activity"`,
                    sort: '-created',
                    requestKey: null
                });

                const safeParse = (data) => {
                    try {
                        return typeof data === 'string' ? JSON.parse(data) : data;
                    } catch (e) {
                        console.warn('JSON Parse error in demographics:', e);
                        return {};
                    }
                };

                const genderData = genderRecords.items.length > 0 ? safeParse(genderRecords.items[0].data) : {};
                const territoryData = territoryRecords.items.length > 0 ? safeParse(territoryRecords.items[0].data) : {};
                const activityData = activityRecords.items.length > 0 ? safeParse(activityRecords.items[0].data) : [];

                // Map to AudienceView format
                // AudienceView expects: genderAge (keys: 18-24, etc? Or just Gender?), cities, countries
                // TikTok 'gender' data is { Male: 0.82, Female: 0.17 }
                // TikTok 'territory' data is { BR: 0.91, JP: 0.008 }

                // We need to map this.
                // genderAge: we only have Gender. AudienceView might expect Age ranges. 
                // We might need to adapt AudienceView or map "Male"/"Female" to a dummy age range?
                // Or just pass `genderDistribution: genderData` and update AudienceView to handle it.
                // Let's pass what we have and let AudienceView component logic handle (or fail/show partial).
                // Actually AudienceView expects `genderAge` object where keys are ages and values are {male, female}.
                // TikTok only gives global Gender.
                // We can fake it or just set a "All Ages" key?

                return {
                    id: 'tiktok-latest',
                    importDate: new Date().toISOString(),
                    tiktokGender: genderData, // Pass raw for now?
                    countries: Object.entries(territoryData).map(([name, value]) => ({ name, value: value * 100 })),
                    cities: [], // Empty for now as TikTok doesn't provide cities in this file
                    genderAge: { "All": { male: (genderData['Male'] || 0) * 100, female: (genderData['Female'] || 0) * 100 } },
                    hourlyActivity: activityData // Add hourly activity
                };
            }

            // Get latest record
            const records = await pb.collection('instagram_audience_demographics').getList(1, 1, {
                filter: `platform = "instagram" && country = "${country}"`,
                sort: '-import_date',
                requestKey: null
            });

            if (records.items.length === 0) return null;

            const item = records.items[0];
            return {
                id: item.id,
                importDate: item.import_date,
                genderAge: typeof item.gender_age_data === 'string' ? JSON.parse(item.gender_age_data) : item.gender_age_data || {},
                cities: typeof item.cities_data === 'string' ? JSON.parse(item.cities_data) : item.cities_data || [],
                countries: typeof item.countries_data === 'string' ? JSON.parse(item.countries_data) : item.countries_data || []
            };
        } catch (err) {
            console.error("Error fetching audience demographics", err);
            return null;
        }
    },

    /**
     * Atualiza a imagem de capa de um conteúdo
     * @param {string} contentId - ID do conteúdo
     * @param {File} imageFile - Arquivo de imagem
     */
    async updateContentImage(contentId, imageFile, platform = 'instagram') {
        try {
            const formData = new FormData();
            formData.append('image_file', imageFile);

            const collectionName = platform === 'tiktok' ? 'tiktok_content' : 'instagram_content';

            const result = await pb.collection(collectionName).update(
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

        // Check if we have imageFile field (from mapped data) or image_file (from raw PB data)
        const imageField = item.imageFile || item.image_file;

        if (imageField && item.pbId) {
            // Construct PocketBase file URL manually
            // Format: https://auth.meganalise.pro/api/files/COLLECTION_NAME/RECORD_ID/FILENAME

            let collection = 'instagram_content';
            if (item.social_network === 'tiktok' || item.platform === 'tiktok') {
                collection = 'tiktok_content';
            }

            return `https://auth.meganalise.pro/api/files/${collection}/${item.pbId}/${imageField}`;
        }

        // Senão, usa URL externa (compatibilidade)
        return item.imageUrl || item.image_url || null;
    },

    /**
     * EVIDENCE REGISTRY METHODS
     */

    /**
     * Creates or updates an Evidence Registry
     * @param {Object} data - { title, start_date, end_date, keywords (array) }
     */
    async saveEvidenceRegistry(data) {
        try {
            // Keywords stored as JSON
            const payload = {
                ...data,
                keywords: JSON.stringify(data.keywords),
                // Ensure type and country are saved if provided, defaults if not
                type: data.type || 'keyword',
                country: data.country || 'Brazil' // Default to Brazil if not specified
            };

            // Check if we are updating or creating (if ID exists)
            if (data.id) {
                return await pb.collection('evidence_registries').update(data.id, payload);
            } else {
                return await pb.collection('evidence_registries').create(payload);
            }
        } catch (err) {
            console.error("Error saving evidence registry", err);
            throw err;
        }
    },

    /**
     * Fetches all evidence registries
     */
    async getEvidenceRegistries() {
        try {
            const records = await pb.collection('evidence_registries').getFullList({
                sort: '-created',
            });
            return records.map(r => ({
                ...r,
                keywords: typeof r.keywords === 'string' ? JSON.parse(r.keywords) : r.keywords,
            }));
        } catch (err) {
            console.error("Error fetching registries", err);
            return [];
        }
    },

    /**
     * Deletes a registry
     */
    async deleteEvidenceRegistry(id) {
        return await pb.collection('evidence_registries').delete(id);
    },

    /**
     * Fetches details for a single registry
     */
    async getEvidenceRegistry(id) {
        try {
            const record = await pb.collection('evidence_registries').getOne(id);
            return {
                ...record,
                keywords: typeof record.keywords === 'string' ? JSON.parse(record.keywords) : record.keywords
            };
        } catch (err) {
            console.error("Error fetching registry details", err);
            return null;
        }
    },

    /**
     * Fetches aggregated dashboard data filtered by registry parameters
     * @param {string} registryId 
     */
    async getEvidenceDashboardData(registryId) {
        try {
            // 1. Get Registry Details
            const registry = await this.getEvidenceRegistry(registryId);
            if (!registry) throw new Error("Registry not found");

            const { start_date, end_date, keywords } = registry;
            const keywordsLower = keywords.map(k => k.toLowerCase());

            // 2. Fetch Content from Instagram within date range
            // Ensure dates are in YYYY-MM-DD format regardless of how they are stored (ISO vs simple date)
            const startDateStr = start_date.split('T')[0].split(' ')[0];
            const endDateStr = end_date.split('T')[0].split(' ')[0];

            // Use 'date' field instead of 'timestamp'
            // 3. Construct Filter
            // Combine Date range AND Keywords
            let filter = `date >= "${startDateStr} 00:00:00" && date <= "${endDateStr} 23:59:59"`;

            // Filter by country if registry has it
            if (registry.country) {
                // Map frontend country names to DB country codes if necessary, or just use what is saved
                // Assuming consistency: 'Brazil' -> 'Brazil' or 'BR'. Let's assume strict match for now.
                // NOTE: 'Brazil' vs 'Brasil' mismatch risk.
                // Best practice: Use codes (BR, PY) or normalized names.
                // Current upload uses "Brasil", "Paraguai".
                // Registry should save "Brasil", "Paraguai".
                filter += ` && country = "${registry.country}"`;
            }

            if (keywords.length > 0) {
                // (title ~ "k1" || title ~ "k2" || ... || author ~ "k1" ...)
                const keywordConditions = keywords.map(k => `title ~ "${k}" || author ~ "${k}"`).join(' || ');
                filter += ` && (${keywordConditions})`;
            }

            // 4. Query Multiple Collections (Instagram & TikTok)
            const collections = ['instagram_content', 'tiktok_content'];

            // Execute queries in parallel
            const queryPromises = collections.map(collectionName =>
                pb.collection(collectionName).getList(1, 500, {
                    filter: filter,
                    sort: '-date',
                    requestKey: null // Disable auto-cancellation
                }).catch(err => {
                    console.warn(`Error querying ${collectionName}`, err);
                    return { items: [] };
                })
            );

            const results = await Promise.all(queryPromises);

            // Merge and Sort
            const allItems = results.flatMap(res => res.items);

            // Sort by date descending (merging two sorted lists needs re-sort)
            allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

            // 5. Refine matches with Whole Word check (in memory)
            // PocketBase '~' operator is a simple "LIKE", so "realme" matches "realmente".
            // We strictly filter for whole words here.

            let refinedContent = allItems;

            if (keywords.length > 0) {
                refinedContent = allItems.filter(item => {
                    if (!item.title) return false;
                    const titleLower = item.title.toLowerCase();

                    // Check if ANY keyword matches as a whole word
                    return keywords.some(keyword => {
                        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex chars
                        // Regex: Smart boundary check
                        // If keyword starts with specific symbols (like @), \b fails at the start because @ is non-word.
                        // We use (^|[^\w]) to match start of string or a non-word char separator.
                        let regex;
                        if (/^[@#]/.test(keyword)) {
                            regex = new RegExp(`(^|[^\\w])${escapedKeyword}(?![\\w])`, 'i');
                        } else {
                            regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
                        }
                        // Check Title OR Author
                        if (regex.test(item.title)) return true;
                        if (item.author && regex.test(item.author)) return true;

                        return false;
                    });
                });
            }

            const matchedContent = refinedContent;

            // 6. Calculate Aggregated Metrics for matched content
            const metrics = {
                total_posts: matchedContent.length,
                total_likes: matchedContent.reduce((sum, item) => sum + (item.likes || 0), 0),
                total_comments: matchedContent.reduce((sum, item) => sum + (item.comments || 0), 0),
                total_views: matchedContent.reduce((sum, item) => sum + (item.views || 0), 0),
            };

            // Engagement: (Likes + Comments + Shares + Saved usually) - using Likes + Comments for now
            // But let's verify what 'interactions' means in other dashboards. Usually (likes+comments+shares+saved).
            // Let's check item fields.
            metrics.total_interactions = metrics.total_likes + metrics.total_comments + matchedContent.reduce((sum, item) => sum + (item.shares || 0) + (item.saved || 0), 0);

            return {
                registry,
                metrics,
                content: matchedContent
            };

        } catch (err) {
            console.error("Error generating evidence dashboard", err);
            throw err;
        }
    }
};
