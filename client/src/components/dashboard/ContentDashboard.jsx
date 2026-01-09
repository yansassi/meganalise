import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import ContentTable from './ContentTable';
import StatCards from './StatCards';

const ContentDashboard = () => {
    const { country } = useOutletContext();
    const [data, setData] = useState({
        reels: [],
        stats: [],
        isLoaded: false
    });

    useEffect(() => {
        loadFromDatabase();
    }, [country]);

    const loadFromDatabase = async () => {
        const dbData = await dataService.getDashboardData(country);
        processDbData(dbData);
    };

    const processDbData = (dbData) => {
        let reels = [];
        // Stats accumulators for Reels ONLY
        let totalReach = 0;
        let totalInteractions = 0;
        let totalViews = 0;
        let totalSaved = 0;

        dbData.content.forEach(c => {
            const item = {
                id: c.original_id,
                title: c.title,
                imageUrl: c.image_url,
                platform: c.platform_type,
                manager: 'Time Social',
                date: new Date(c.date).toLocaleDateString('pt-BR'),
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
            const isStory = c.platform_type === 'story' || (c.platform_type === 'social' && (c.views > 0 || c.title.startsWith('Story -')));

            if (!isStory) {
                reels.push(item);
                totalReach += (item.reach || 0);
                totalViews += (item.views || 0);
                totalSaved += (item.saved || 0);
                totalInteractions += (item.likes || 0) + (item.shares || 0) + (item.comments || 0) + (item.saved || 0);
            }
        });

        const stats = [
            { label: 'Alcance (Reels/Feed)', value: totalReach, trend: 0, icon: 'visibility', color: 'blue' },
            { label: 'Interações', value: totalInteractions, trend: 0, icon: 'favorite', color: 'purple' },
            { label: 'Visualizações', value: totalViews, trend: 0, icon: 'play_circle', color: 'red' },
            { label: 'Salvamentos', value: totalSaved, trend: 0, icon: 'bookmark', color: 'yellow' }
        ];

        setData({
            reels,
            stats,
            isLoaded: true
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Instagram - Conteúdo (Feed & Reels)</h1>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
                    {country}
                </span>
            </div>

            {data.isLoaded && (
                <div className="flex flex-col gap-8">
                    <StatCards stats={data.stats} />
                    <ContentTable
                        items={data.reels}
                        title="Galeria de Conteúdo"
                        limit={25}
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
