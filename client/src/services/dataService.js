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
        const endpoint = platform.toLowerCase();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.meganalise.pro';

        const response = await fetch(`${apiUrl}/api/upload/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pb.authStore.token}`
            },
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

            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.meganalise.pro';
            const response = await fetch(`${apiUrl}/api/dashboard/${country}/${platform}?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${pb.authStore.token}`
                }
            });

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

            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.meganalise.pro';
            const response = await fetch(`${apiUrl}/api/dashboard/aggregate/${country}?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${pb.authStore.token}`
                }
            });

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
        let collectionName = '';
        try {
            const platformLower = platform.toLowerCase();

            if (platformLower === 'tiktok') {
                collectionName = 'tiktok_audience_demographics';
                // Fetch latest gender and territory records
                // We might need to fetch multiple records and merge
                const genderRecords = await pb.collection(collectionName).getList(1, 1, {
                    filter: `type = "gender" && country = "${country}"`,
                    sort: '-created',
                    requestKey: null
                });

                const territoryRecords = await pb.collection(collectionName).getList(1, 1, {
                    filter: `type = "territory" && country = "${country}"`,
                    sort: '-created',
                    requestKey: null
                });

                const activityRecords = await pb.collection(collectionName).getList(1, 1, {
                    filter: `type = "activity" && country = "${country}"`,
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

            // Determine collection name based on platform
            collectionName = platformLower === 'facebook' 
                ? 'facebook_audience_demographics' 
                : 'instagram_audience_demographics';

            const filter = platformLower === 'facebook'
                ? `platform = "facebook"` // Facebook collection seems to be missing 'country' field
                : `platform = "instagram" && country = "${country}"`;

            // Get latest record
            const records = await pb.collection(collectionName).getList(1, 1, {
                filter: filter,
                sort: '-import_date',
                requestKey: null
            });

            if (records.items.length === 0) {
                return null;
            }

            const item = records.items[0];
            return {
                id: item.id,
                importDate: item.import_date,
                genderAge: typeof item.gender_age === 'string' ? JSON.parse(item.gender_age) : item.gender_age || item.gender_age_data || {},
                cities: typeof item.cities === 'string' ? JSON.parse(item.cities) : item.cities || item.cities_data || [],
                countries: typeof item.countries === 'string' ? JSON.parse(item.countries) : item.countries || item.countries_data || [],
                followersHistory: typeof item.followers_history_data === 'string' ? JSON.parse(item.followers_history_data) : item.followers_history_data || [],
                similarPages: typeof item.similar_pages_data === 'string' ? JSON.parse(item.similar_pages_data) : item.similar_pages_data || []
            };
        } catch (err) {
            console.error("Error fetching audience demographics Details:", {
                platform,
                country,
                collection: collectionName,
                error: err.message,
                originalError: err
            });
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

            const platformLower = platform?.toLowerCase();
            const collectionName = platformLower === 'tiktok' ? 'tiktok_content' : 
                                 platformLower === 'facebook' ? 'facebook_content' : 
                                 platformLower === 'youtube' ? 'youtube_content' : 'instagram_content';

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

        const imageField = item.imageFile || item.image_file;
        const pbUrl = import.meta.env.VITE_PB_URL || 'https://auth.meganalise.pro';

        if (imageField && (item.pbId || item.id)) {
            let collection = 'instagram_content';
            const network = (item.social_network || item.platform || '').toLowerCase();
            
            if (network === 'tiktok') collection = 'tiktok_content';
            else if (network === 'facebook') collection = 'facebook_content';
            else if (network === 'youtube') collection = 'youtube_content';

            return `${pbUrl}/api/files/${collection}/${item.pbId || item.id}/${imageField}`;
        }

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
            // Keywords e platforms armazenados como JSON
            const payload = {
                ...data,
                keywords: JSON.stringify(data.keywords),
                platforms: JSON.stringify(data.platforms || ['instagram', 'tiktok', 'facebook', 'youtube']),
                type: data.type || 'keyword',
                country: data.country || 'Brazil'
            };

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
                requestKey: null,
            });
            return records.map(r => ({
                ...r,
                keywords: typeof r.keywords === 'string' ? JSON.parse(r.keywords) : r.keywords,
                platforms: (() => {
                    try {
                        return typeof r.platforms === 'string' ? JSON.parse(r.platforms) : (r.platforms || ['instagram', 'tiktok', 'facebook', 'youtube']);
                    } catch { return ['instagram', 'tiktok', 'facebook', 'youtube']; }
                })()
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
            const record = await pb.collection('evidence_registries').getOne(id, { requestKey: null });
            return {
                ...record,
                keywords: typeof record.keywords === 'string' ? JSON.parse(record.keywords) : record.keywords,
                platforms: (() => {
                    try {
                        return typeof record.platforms === 'string' ? JSON.parse(record.platforms) : (record.platforms || ['instagram', 'tiktok', 'facebook', 'youtube']);
                    } catch { return ['instagram', 'tiktok', 'facebook', 'youtube']; }
                })()
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

            // 2. Calculate Metrics using helper
            const { metrics, content } = await this.calculateRegistryMetrics(registry);

            return {
                registry,
                metrics,
                content
            };

        } catch (err) {
            console.error("Error generating evidence dashboard", err);
            throw err;
        }
    },

    /**
     * Calculates metrics for a specific registry
     * @param {Object} registry 
     */
    async calculateRegistryMetrics(registry, dateOverride = null, platformFilter = 'all') {
        try {
            const { keywords } = registry;
            const keywordsLower = keywords.map(k => k.toLowerCase());

            // Determine date range: Use override if provided, otherwise registry defaults
            let start_date, end_date;

            if (dateOverride && dateOverride.startDate && dateOverride.endDate) {
                start_date = dateOverride.startDate;
                end_date = dateOverride.endDate;
            } else {
                start_date = registry.start_date;
                end_date = registry.end_date;
            }

            // Ensure dates are in YYYY-MM-DD format regardless of how they are stored (ISO vs simple date)
            const startDateStr = start_date.split('T')[0].split(' ')[0];
            const endDateStr = end_date.split('T')[0].split(' ')[0];

            // Use 'date' field instead of 'timestamp'
            // Construct Filter
            // Combine Date range AND Keywords
            let filter = `date >= "${startDateStr} 00:00:00" && date <= "${endDateStr} 23:59:59"`;

            // Filter by country if registry has it
            if (registry.country) {
                filter += ` && country = "${registry.country}"`;
            }

            if (keywords.length > 0) {
                // (title ~ "k1" || title ~ "k2" || ... || author ~ "k1" ...)
                const keywordConditions = keywords.map(k => {
                    const clean = k.startsWith('@') ? k.slice(1) : k;
                    let cond = `title ~ "${k}" || author ~ "${k}" || permalink ~ "${k}"`;
                    if (clean !== k) {
                        cond += ` || title ~ "${clean}" || author ~ "${clean}" || permalink ~ "${clean}"`;
                    }
                    return `(${cond})`;
                }).join(' || ');
                filter += ` && (${keywordConditions})`;
            }

            // Query Multiple Collections based on filter
            // Usa registry.platforms se definido, caso contrário todas
            const platformList = registry.platforms && registry.platforms.length > 0
                ? registry.platforms
                : ['instagram', 'tiktok', 'facebook', 'youtube'];

            let collections = [];
            if (platformFilter === 'all') {
                const collMap = {
                    instagram: 'instagram_content',
                    tiktok: 'tiktok_content',
                    facebook: 'facebook_content',
                    youtube: 'youtube_content',
                };
                collections = platformList.map(p => collMap[p]).filter(Boolean);
            } else if (platformFilter === 'instagram') {
                collections = ['instagram_content'];
            } else if (platformFilter === 'tiktok') {
                collections = ['tiktok_content'];
            } else if (platformFilter === 'facebook') {
                collections = ['facebook_content'];
            } else if (platformFilter === 'youtube') {
                collections = ['youtube_content'];
            }

            // Execute queries in parallel
            const queryPromises = collections.map(async (collectionName) => {
                // Determine which fields to search based on collection
                // YouTube and Facebook (schema issues) might lack certain fields
                let searchFields = ['title', 'permalink'];
                if (collectionName !== 'youtube_content' && collectionName !== 'facebook_content') {
                    searchFields.push('author');
                }

                const buildFilter = (fields) => {
                    let filter = `date >= "${startDateStr} 00:00:00" && date <= "${endDateStr} 23:59:59"`;
                    if (registry.country) {
                        filter += ` && country = "${registry.country}"`;
                    }
                    if (keywords.length > 0) {
                        const keywordConditions = keywords.map(k => {
                            const clean = k.startsWith('@') ? k.slice(1) : k;
                            const searchFieldsWithPermalink = [...new Set([...fields, 'permalink'])];
                            const parts = searchFieldsWithPermalink.map(field => `${field} ~ "${k}"`);
                            if (k !== clean) {
                                searchFieldsWithPermalink.forEach(field => parts.push(`${field} ~ "${clean}"`));
                            }
                            return `(${parts.join(' || ')})`;
                        }).join(' || ');
                        filter += ` && (${keywordConditions})`;
                    }
                    return filter;
                };

                const executeQuery = async (fields) => {
                    return pb.collection(collectionName).getList(1, 500, {
                        filter: buildFilter(fields),
                        sort: '-date',
                        requestKey: null
                    });
                };

                try {
                    let res;
                    try {
                        res = await executeQuery(searchFields);
                    } catch (err) {
                        // If 400 error, it's likely a missing field (e.g. author in FB)
                        // Try fallback to just title and permalink
                        if (err.status === 400 && searchFields.includes('author')) {
                            console.warn(`Retrying ${collectionName} without 'author' field...`);
                            res = await executeQuery(['title', 'permalink']);
                        } else {
                            throw err;
                        }
                    }

                    let items = res.items;

                    // STRICT FILTER: Check for cross-contamination
                    if (collectionName === 'instagram_content') {
                        items = items.filter(item => {
                            const link = (item.permalink || '').toLowerCase();
                            return !link.includes('facebook.com');
                        });
                    }

                    return {
                        items: items.map(item => ({
                            ...item,
                            social_network: collectionName === 'tiktok_content' ? 'tiktok'
                                : collectionName === 'facebook_content' ? 'facebook'
                                : collectionName === 'youtube_content' ? 'youtube'
                                : 'instagram',
                            platform: (collectionName === 'tiktok_content' || collectionName === 'youtube_content') ? 'video'
                                : (item.platform_type || item.platform || 'social')
                        }))
                    };
                } catch (err) {
                    console.error(`Error querying ${collectionName}:`, err);
                    return { items: [] };
                }
            });

            const results = await Promise.all(queryPromises);

            // Merge and Sort
            const allItems = results.flatMap(res => res.items);

            // Sort by date descending
            allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Refine matches with Whole Word check (in memory)
            let refinedContent = allItems;

            if (keywords.length > 0) {
                refinedContent = allItems.filter(item => {
                    // Check if ANY keyword matches as a whole word
                    return keywords.some(keyword => {
                        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        let regex;
                        if (/^[@#]/.test(keyword)) {
                            regex = new RegExp(`(^|[^\\w])${escapedKeyword}(?![\\w])`, 'i');
                        } else {
                            regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
                        }

                        // Strict Influencer Logic
                        if (registry.type === 'influencer') {
                            const cleanKeyword = keyword.startsWith('@') ? keyword.slice(1) : keyword;
                            const handleLower = cleanKeyword.toLowerCase();
                            
                            // 1. Identificar quem postou o conteúdo (Poster)
                            let poster = (item.author || '').toLowerCase();
                            
                            // Extrair do permalink se possível (mais confiável para Stories do Instagram)
                            if (item.permalink && item.permalink.includes('instagram.com/')) {
                                const urlParts = item.permalink.split('instagram.com/')[1].split('/');
                                if (urlParts[0] === 'stories' && urlParts[1]) {
                                    poster = urlParts[1].toLowerCase();
                                } else if (urlParts[0] && urlParts[0] !== 'p' && urlParts[0] !== 'reel') {
                                    poster = urlParts[0].toLowerCase();
                                }
                            }

                            // 2. Definir contas oficiais da marca para detectar compartilhamentos
                            const brandAccounts = ['megaeletronicosoficialpy', 'megaelectronicosparaguay'];

                            // 3. Lógica de Correspondência
                            // Caso A: O autor do post é o próprio influenciador (Conteúdo Original)
                            if (poster === handleLower) return true;

                            // Caso B: O post é da marca mencionando o influenciador (Compartilhamento)
                            if (brandAccounts.includes(poster)) {
                                // Aceita se houver uma menção no título/legenda (com ou sem @)
                                if (item.title && regex.test(item.title)) {
                                    item.is_shared_content = true;
                                    item.original_author_tagged = handleLower;
                                    return true;
                                }
                                return false;
                            }

                            // Caso C: Outra conta mencionando o influenciador (Menção de Terceiros)
                            if (keyword.startsWith('@') && item.title && regex.test(item.title)) return true;
                            if (item.author && item.author.toLowerCase().includes(handleLower)) return true;

                            return false;
                        } else {
                            // Default Evidence Logic (Broad match)
                            if (item.title && regex.test(item.title)) return true;
                            if (item.author && regex.test(item.author)) return true;
                            if (item.permalink && regex.test(item.permalink)) return true;
                            return false;
                        }
                    });
                });
            }

            const matchedContent = refinedContent;

            // Calculate Aggregated Metrics for matched content
            const metrics = {
                total_posts: matchedContent.length,
                total_likes: matchedContent.reduce((sum, item) => sum + (item.likes || 0), 0),
                total_comments: matchedContent.reduce((sum, item) => sum + (item.comments || 0), 0),
                total_views: matchedContent.reduce((sum, item) => sum + (item.views || item.reach || 0), 0),
                total_shares: matchedContent.reduce((sum, item) => sum + (item.shares || 0), 0),
                total_saves: matchedContent.reduce((sum, item) => sum + (item.saved || 0), 0),
            };

            metrics.total_interactions = metrics.total_likes + metrics.total_comments + metrics.total_shares + metrics.total_saves;

            return { metrics, content: matchedContent };

        } catch (err) {
            console.error("Error calculating registry metrics", err);
            return { metrics: { total_views: 0, total_posts: 0, total_interactions: 0 }, content: [] };
        }
    },

    /**
     * Updates registry image
     */
    async updateRegistryImage(id, imageFile) {
        try {
            const formData = new FormData();
            formData.append('image_file', imageFile);

            return await pb.collection('evidence_registries').update(id, formData, { requestKey: null });
        } catch (error) {
            console.error('Error uploading registry image:', error);
            throw error;
        }
    },

    /**
     * Gets registry image URL
     */
    getRegistryImageUrl(registry) {
        if (!registry || !registry.image_file) return null;
        const pbUrl = import.meta.env.VITE_PB_URL || 'https://auth.meganalise.pro';
        return `${pbUrl}/api/files/evidence_registries/${registry.id}/${registry.image_file}`;
    },

    /**
     * INFLUENCERS METHODS
     */
    async getInfluencers() {
        try {
            return await pb.collection('influencers').getFullList();
        } catch (err) {
            console.error("Error fetching influencers", err);
            return [];
        }
    },

    async createInfluencer(data) {
        return await pb.collection('influencers').create(data);
    },

    async deleteInfluencer(id) {
        return await pb.collection('influencers').delete(id);
    }
};
