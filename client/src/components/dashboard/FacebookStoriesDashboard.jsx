import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import StatCards from './StatCards';
import ContentGrid from './ContentGrid';
import DateRangeFilter from './DateRangeFilter';

const FacebookStoriesDashboard = () => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [data, setData] = useState({
        stats: [],
        contentItems: [],
        isLoaded: false
    });

    useEffect(() => {
        loadData();
    }, [country, dateRange]);

    const loadData = async () => {
        const dbData = await dataService.getDashboardData(country, 'Facebook', dateRange.startDate, dateRange.endDate);
        processStoriesData(dbData);
    };

    const processStoriesData = (dbData) => {
        let totalReach = 0;
        let totalImpressions = 0;
        let totalStories = 0;
        let totalInteractions = 0;

        // Filter valid stories for Facebook
        const stories = dbData.content.filter(c =>
            c.platform_type === 'story' ||
            c.platform === 'story' ||
            (c.title && (
                c.title.toLowerCase().startsWith('story') || 
                c.title.toLowerCase().includes('historia') ||
                c.title.toLowerCase().includes('história')
            ))
        );


        totalStories = stories.length;

        stories.forEach(s => {
            totalReach += s.reach || 0;
            totalImpressions += s.views || 0;
            totalInteractions += (s.likes || 0) + (s.shares || 0) + (s.comments || 0);
        });

        const storyItems = stories.map(c => ({
            id: c.original_id,
            pbId: c.id,
            title: c.title,
            imageUrl: c.image_url,
            imageFile: c.image_file,
            platform: 'story',
            social_network: 'facebook',
            permalink: c.permalink,
            manager: 'Time Social',
            date: formatDate(c.date),
            reach: c.reach,
            views: c.views,
            likes: c.likes,
            shares: c.shares
        }));

        setData({
            stats: [
                { label: 'Stories no Facebook', value: totalStories, trend: 0, icon: 'amp_stories', color: 'pink' },
                { label: 'Alcance de Stories', value: totalReach, trend: 0, icon: 'visibility', color: 'blue' },
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Facebook - Stories</h1>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-lg font-bold">
                        {country === 'BR' ? '🇧🇷' : '🇵🇾'}
                    </span>
                </div>
                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" initialRange={dateRange} />
            </div>

            {data.isLoaded ? (
                <>
                    <StatCards stats={data.stats} />
                    <ContentGrid items={data.contentItems} title="Histórico de Stories (Facebook)" limit={45} showPagination={true} />
                </>
            ) : (
                <div className="p-20 text-center text-slate-400">
                    <span className="material-icons-round animate-spin text-4xl mb-4">sync</span>
                    <p>Carregando stories do Facebook...</p>
                </div>
            )}
        </div>
    );
};

export default FacebookStoriesDashboard;
