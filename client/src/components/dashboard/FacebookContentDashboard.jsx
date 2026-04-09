import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import ContentGrid from './ContentGrid';
import StatCards from './StatCards';
import DateRangeFilter from './DateRangeFilter';

const FacebookContentDashboard = () => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [data, setData] = useState({
        items: [],
        stats: [],
        isLoaded: false
    });

    useEffect(() => {
        loadFromDatabase();
    }, [country, dateRange]);

    const loadFromDatabase = async () => {
        const dbData = await dataService.getDashboardData(country, 'Facebook', dateRange.startDate, dateRange.endDate);
        processDbData(dbData);
    };

    const processDbData = (dbData) => {
        let items = [];
        let totalReach = 0;
        let totalInteractions = 0;
        let totalViews = 0;
        let totalShares = 0;

        dbData.content.forEach(c => {
            const item = {
                id: c.original_id,
                pbId: c.id,
                title: c.title,
                imageUrl: c.image_url,
                imageFile: c.image_file,
                platform: c.platform_type,
                social_network: 'facebook',
                manager: 'Time Social',
                date: formatDate(c.date),
                reach: c.reach,
                views: c.views,
                likes: c.likes,
                shares: c.shares,
                comments: c.comments,
                permalink: c.permalink
            };

            // Filter out Stories
            const isStory = c.platform_type === 'story' || c.title?.toLowerCase().startsWith('story');

            if (!isStory) {
                items.push(item);
                totalReach += (item.reach || 0);
                totalViews += (item.views || 0);
                totalShares += (item.shares || 0);
                totalInteractions += (item.likes || 0) + (item.shares || 0) + (item.comments || 0);
            }
        });

        const stats = [
            { label: 'Alcance do Feed', value: totalReach, trend: 0, icon: 'visibility', color: 'blue' },
            { label: 'Interações Totais', value: totalInteractions, trend: 0, icon: 'favorite', color: 'purple' },
            { label: 'Visualizações de Vídeo', value: totalViews, trend: 0, icon: 'play_circle', color: 'indigo' },
            { label: 'Compartilhamentos', value: totalShares, trend: 0, icon: 'share', color: 'green' }
        ];

        setData({
            items,
            stats,
            isLoaded: true
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Facebook - Conteúdo (Feed & Vídeos)</h1>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-lg font-bold">
                        {country === 'BR' ? '🇧🇷' : '🇵🇾'}
                    </span>
                </div>
                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" initialRange={dateRange} />
            </div>

            {data.isLoaded ? (
                <div className="flex flex-col gap-8">
                    <StatCards stats={data.stats} />
                    <ContentGrid
                        items={data.items}
                        title="Galeria de Publicações"
                        limit={45}
                        showPagination={true}
                    />
                </div>
            ) : (
                <div className="p-20 text-center text-slate-400">
                    <span className="material-icons-round animate-spin text-4xl mb-4">sync</span>
                    <p>Carregando dados do Facebook...</p>
                </div>
            )}
        </div>
    );
};

export default FacebookContentDashboard;
