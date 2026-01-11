import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import StatCards from './StatCards';
import ContentGrid from './ContentGrid';
import DateRangeFilter from './DateRangeFilter';

const StoriesDashboard = () => {
    const { country } = useOutletContext();
    const [data, setData] = useState({
        stats: [],
        contentItems: [],
        isLoaded: false
    });
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);
        return { startDate: start, endDate: end };
    });

    useEffect(() => {
        // if (!dateRange.startDate || !dateRange.endDate) return; // Removed blocking check
        loadData();
    }, [country, dateRange]);

    const loadData = async () => {
        const dbData = await dataService.getDashboardData(country, 'Instagram', dateRange.startDate, dateRange.endDate);
        processStoriesData(dbData);
    };

    const processStoriesData = (dbData) => {
        let totalReach = 0;
        let totalImpressions = 0;
        let totalStories = 0;
        let totalInteractions = 0;

        // Filter valid stories
        // Logic: Explicit 'story' type OR heuristic (social + views > 0 or Title starts with 'Story -')
        const stories = dbData.content.filter(c =>
            c.platform_type === 'story' ||
            (c.platform_type === 'social' && (c.views > 0 || c.title.startsWith('Story -')))
        );

        totalStories = stories.length;

        stories.forEach(s => {
            totalReach += s.reach || 0;
            totalImpressions += s.views || 0; // "Visualizações" maps to views
            totalInteractions += (s.likes || 0) + (s.shares || 0) + (s.comments || 0) + (s.saved || 0);
        });

        const storyItems = stories.map(c => ({
            id: c.original_id,
            pbId: c.id, // PocketBase ID for file URL
            title: c.title,
            imageUrl: c.image_url,
            imageFile: c.image_file, // For uploaded cover
            platform: c.platform_type, // Use actual platform type (story)
            manager: 'Time Social',
            date: new Date(c.date).toLocaleDateString('pt-BR'),
            virality: c.virality_score,
            status: c.status,
            reach: c.reach,
            views: c.views,
            likes: c.likes,
            shares: c.shares
        }));

        setData({
            stats: [
                { label: 'Stories Publicados', value: totalStories, trend: 0, icon: 'amp_stories', color: 'pink' },
                { label: 'Alcance Total', value: totalReach, trend: 0, icon: 'visibility', color: 'blue' },
                { label: 'Impressões (Views)', value: totalImpressions, trend: 0, icon: 'remove_red_eye', color: 'purple' },
                { label: 'Interações', value: totalInteractions, trend: 0, icon: 'favorite', color: 'red' },
            ],
            contentItems: storyItems,
            isLoaded: true
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Instagram - Stories</h1>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
                        {country}
                    </span>
                </div>
                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" />
            </div>

            <StatCards stats={data.stats} />

            <ContentGrid items={data.contentItems} title="Histórico de Stories" limit={45} showPagination={true} />
        </div>
    );
};

export default StoriesDashboard;
