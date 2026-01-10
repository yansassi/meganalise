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
     * Uploads Instagram CSV to backend for processing
     * @param {File} file 
     * @param {string} country 
     */
    async uploadInstagramData(file, country) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('country', country);

        const response = await fetch('https://api.meganalise.pro/api/upload/instagram', {
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

        if (item.image_file) {
            return pb.files.getURL(item, item.image_file);
        }

        // Senão, usa URL externa (compatibilidade)
        return item.image_url || null;
    }
};
