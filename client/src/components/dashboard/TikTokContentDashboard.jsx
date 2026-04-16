import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { calcPreviousPeriod } from '../../utils/dateUtils';
import ContentGrid from './ContentGrid';
import StatCards from './StatCards';
import DateRangeFilter from './DateRangeFilter';

const TikTokContentDashboard = () => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [data, setData] = useState({
        videos: [],
        stats: [],
        isLoaded: false
    });

    useEffect(() => {
        loadFromDatabase();
    }, [country, dateRange]);

    const loadFromDatabase = async () => {
        const prevPeriod = calcPreviousPeriod(dateRange.startDate, dateRange.endDate, dateRange.preset);

        const [dbData, prevDbData] = await Promise.all([
            dataService.getDashboardData(country, 'TikTok', dateRange.startDate, dateRange.endDate),
            prevPeriod 
                ? dataService.getDashboardData(country, 'TikTok', prevPeriod.startDate, prevPeriod.endDate)
                : Promise.resolve({ content: [], metrics: [] })
        ]);

        processDbData(dbData, prevDbData);
    };

    const processDbData = (dbData, prevDbData) => {
        const calcTrend = (current, previous) => {
            if (!previous || previous === 0) return 0;
            return ((current - previous) / previous) * 100;
        };
        let videos = [];
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;

        dbData.content.forEach(c => {
            const item = {
                id: c.original_id,
                pbId: c.id,
                title: c.title,
                imageUrl: c.image_url,
                imageFile: c.image_file,
                platform: 'tiktok', // Explicitly set platform for grid/modal
                manager: 'Time Social',
                date: c.date ? formatDate(c.date) : 'N/A',
                status: 'Published',
                // TikTok specific metrics mapping
                views: c.views || 0,
                likes: c.likes || 0,
                comments: c.comments || 0,
                shares: c.shares || 0,
                permalink: c.permalink,
                social_network: 'tiktok' // Critical for modal image upload
            };

            videos.push(item);
            totalViews += item.views;
            totalLikes += item.likes;
            totalComments += item.comments;
            totalShares += item.shares;
        });

        // Calculate total interactions
        const totalInteractions = totalLikes + totalComments + totalShares;

        // Calcular totais do período anterior para tendências
        let prevViews = 0;
        let prevLikes = 0;
        let prevComments = 0;
        let prevShares = 0;

        if (prevDbData && prevDbData.content) {
            prevDbData.content.forEach(c => {
                prevViews += (c.views || 0);
                prevLikes += (c.likes || 0);
                prevComments += (c.comments || 0);
                prevShares += (c.shares || 0);
            });
        }

        const stats = [
            { label: 'Visualizações Totais', value: totalViews, trend: calcTrend(totalViews, prevViews), icon: 'play_circle', color: 'red' },
            { label: 'Curtidas', value: totalLikes, trend: calcTrend(totalLikes, prevLikes), icon: 'favorite', color: 'pink' },
            { label: 'Comentários', value: totalComments, trend: calcTrend(totalComments, prevComments), icon: 'chat_bubble', color: 'blue' },
            { label: 'Compartilhamentos', value: totalShares, trend: calcTrend(totalShares, prevShares), icon: 'share', color: 'green' }
        ];

        setData({
            videos,
            stats,
            isLoaded: true
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">TikTok - Conteúdo</h1>
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
                        items={data.videos}
                        title="Galeria de Vídeos"
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

export default TikTokContentDashboard;
