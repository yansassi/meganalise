import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { calcPreviousPeriod } from '../../utils/dateUtils';
import ContentGrid from './ContentGrid';
import StatCards from './StatCards';
import DateRangeFilter from './DateRangeFilter';

const ContentDashboard = () => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [data, setData] = useState({
        reels: [],
        stats: [],
        isLoaded: false
    });

    useEffect(() => {
        // if (!dateRange.startDate || !dateRange.endDate) return; // Removed blocking check
        loadFromDatabase();
    }, [country, dateRange]);

    const loadFromDatabase = async () => {
        const prevPeriod = calcPreviousPeriod(dateRange.startDate, dateRange.endDate, dateRange.preset);

        const [dbData, prevDbData] = await Promise.all([
            dataService.getDashboardData(country, 'Instagram', dateRange.startDate, dateRange.endDate),
            prevPeriod 
                ? dataService.getDashboardData(country, 'Instagram', prevPeriod.startDate, prevPeriod.endDate)
                : Promise.resolve({ content: [], metrics: [] })
        ]);

        processDbData(dbData, prevDbData);
    };

    const processDbData = (dbData, prevDbData) => {
        const calcTrend = (current, previous) => {
            if (!previous || previous === 0) return 0;
            const delta = ((current - previous) / previous) * 100;
            return Number(delta.toFixed(2));
        };
        let reels = [];
        // Stats accumulators for Reels ONLY
        let totalReach = 0;
        let totalInteractions = 0;
        let totalViews = 0;
        let totalSaved = 0;

        dbData.content.forEach(c => {
            const item = {
                id: c.original_id,
                pbId: c.id, // PocketBase ID for file URL
                title: c.title,
                imageUrl: c.image_url,
                imageFile: c.image_file, // For uploaded cover
                platform: c.platform_type,
                manager: 'Time Social',
                date: formatDate(c.date),
                virality: c.virality_score,
                status: c.status,
                reach: c.reach,
                saved: c.saved,
                views: c.views,
                duration: c.duration,
                permalink: c.permalink,
                // Helper for stats calc
                likes: c.likes,
                shares: c.shares,
                comments: c.comments
            };

            // Filter OUT Stories
            // Logic: Is NOT a story platform type AND title doesn't start with Story
            // Logic: Is explicitly a story OR (is social type AND title starts with Story)
            // Do NOT use views > 0 alone, as Reels also have views.
            const isStory = c.platform_type === 'story' || 
                            c.social_network === 'facebook' && c.title?.toLowerCase().includes('story') ||
                            c.permalink?.toLowerCase().includes('/stories/') ||
                            (c.platform_type === 'social' && c.title?.startsWith('Story -'));

            if (!isStory) {
                // Double check it's a valid content type for the feed
                // video (Reels), social (Feed), camera (maybe), image
                reels.push(item);
                totalReach += (item.reach || 0);
                totalViews += (item.views || 0);
                totalSaved += (item.saved || 0);
                totalInteractions += (item.likes || 0) + (item.shares || 0) + (item.comments || 0) + (item.saved || 0);
            }
        });

        // Totais do período anterior para tendências
        let prevReach = 0;
        let prevInteractions = 0;
        let prevViews = 0;
        let prevSaved = 0;

        if (prevDbData && prevDbData.content) {
            prevDbData.content.forEach(c => {
                const isStory = c.platform_type === 'story' || (c.platform_type === 'social' && c.title?.startsWith('Story -'));
                if (!isStory) {
                    prevReach += (c.reach || 0);
                    prevViews += (c.views || 0);
                    prevSaved += (c.saved || 0);
                    prevInteractions += (c.likes || 0) + (c.shares || 0) + (c.comments || 0) + (c.saved || 0);
                }
            });
        }

        const stats = [
            { label: 'Alcance (Reels/Feed)', value: totalReach, trend: calcTrend(totalReach, prevReach), icon: 'visibility', color: 'blue' },
            { label: 'Interações', value: totalInteractions, trend: calcTrend(totalInteractions, prevInteractions), icon: 'favorite', color: 'purple' },
            { label: 'Visualizações', value: totalViews, trend: calcTrend(totalViews, prevViews), icon: 'play_circle', color: 'red' },
            { label: 'Salvamentos', value: totalSaved, trend: calcTrend(totalSaved, prevSaved), icon: 'bookmark', color: 'yellow' }
        ];

        setData({
            reels,
            stats,
            isLoaded: true
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Instagram - Conteúdo (Feed & Reels)</h1>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-lg font-bold border border-gray-200 dark:border-white/10">
                        {country === 'BR' ? '🇧🇷' : '🇵🇾'}
                    </span>
                </div>
                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" initialRange={dateRange} />
            </div>

            {data.isLoaded && (
                <div className="flex flex-col gap-8">
                    <StatCards stats={data.stats} />
                    <ContentGrid
                        items={data.reels}
                        title="Galeria de Conteúdo"
                        limit={45}
                        showPagination={true}
                    />

                </div>
            )}

            {!data.isLoaded && (
                <div className="p-8 text-center text-gray-500">Carregando dados...</div>
            )}
        </div>
    );
};

export default ContentDashboard;
