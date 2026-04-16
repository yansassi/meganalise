import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { calcPreviousPeriod } from '../../utils/dateUtils';
import ContentGrid from './ContentGrid';
import ContentTable from './ContentTable';
import MediaReel from './MediaReel';
import StatCards from './StatCards';
import DateRangeFilter from './DateRangeFilter';
import ContentDetailsModal from './ContentDetailsModal';

const YouTubeContentDashboard = () => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'videos', 'shorts'
    const [selectedItem, setSelectedItem] = useState(null);
    const [data, setData] = useState({
        all: [],
        videos: [],
        shorts: [],
        stats: [],
        isLoaded: false
    });

    useEffect(() => {
        loadFromDatabase();
    }, [country, dateRange]);

    const loadFromDatabase = async () => {
        const prevPeriod = calcPreviousPeriod(dateRange.startDate, dateRange.endDate, dateRange.preset);

        const [dbData, prevDbData] = await Promise.all([
            dataService.getDashboardData(country, 'YouTube', dateRange.startDate, dateRange.endDate),
            prevPeriod 
                ? dataService.getDashboardData(country, 'YouTube', prevPeriod.startDate, prevPeriod.endDate)
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
        let all = [];
        let totalViews = 0;
        let totalWatchTime = 0;
        let totalSubscribers = 0;

        dbData.content.forEach(c => {
            const item = {
                id: c.original_id,
                pbId: c.id,
                title: c.title,
                imageUrl: c.image_url,
                imageFile: c.image_file,
                platform: c.platform_type || 'video',
                social_network: 'youtube',
                manager: 'Time Social',
                date: c.date ? formatDate(c.date) : 'N/A',
                rawDate: c.date,
                status: c.status || 'Published',
                views: c.views || 0,
                likes: c.likes || 0,
                comments: c.comments || 0,
                reach: c.reach || 0,
                watch_time: c.watch_time || 0,
                subscribers: c.subscribers || 0,
                ctr: c.ctr || 0,
                duration: c.duration || 0,
                permalink: c.permalink,
                impressions: c.impressions || 0,
            };

            all.push(item);
            totalViews += item.views;
            totalWatchTime += item.watch_time;
            totalSubscribers += item.subscribers;
        });

        const videos = all.filter(i => i.platform === 'video' || (i.duration && i.duration > 60) || (!i.duration));
        const shorts = all.filter(i => i.platform === 'short' || (i.duration && i.duration <= 60 && i.duration > 0));

        // Calcular totais do período anterior para tendências
        let prevTotalViews = 0;
        let prevTotalWatchTime = 0;
        let prevTotalSubscribers = 0;

        if (prevDbData && prevDbData.content) {
            prevDbData.content.forEach(c => {
                prevTotalViews += (c.views || 0);
                prevTotalWatchTime += (c.watch_time || 0);
                prevTotalSubscribers += (c.subscribers || 0);
            });
        }

        const stats = [
            { label: 'Visualizações Totais', value: totalViews, trend: calcTrend(totalViews, prevTotalViews), icon: 'play_circle', color: 'red' },
            { label: 'Tempo de Exibição', value: totalWatchTime, trend: calcTrend(totalWatchTime, prevTotalWatchTime), icon: 'schedule', color: 'blue', suffix: 'h' },
            { label: 'Inscritos Ganhos', value: totalSubscribers, trend: calcTrend(totalSubscribers, prevTotalSubscribers), icon: 'person_add', color: 'orange' },
            { label: 'Total de Vídeos', value: all.length, trend: calcTrend(all.length, prevDbData?.content?.length || 0), icon: 'video_library', color: 'purple' },
        ];

        setData({ all, videos, shorts, stats, isLoaded: true });
    };

    const getFilteredItems = () => {
        if (activeTab === 'videos') return data.videos;
        if (activeTab === 'shorts') return data.shorts;
        return data.all;
    };

    const tabs = [
        { id: 'all', label: 'Todos', icon: 'video_library', count: data.all.length },
        { id: 'videos', label: 'Vídeos', icon: 'smart_display', count: data.videos.length },
        { id: 'shorts', label: 'Shorts', icon: 'smartphone', count: data.shorts.length },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">YouTube - Conteúdo</h1>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-lg font-bold border border-gray-200 dark:border-white/10">
                        {country === 'BR' ? '🇧🇷' : '🇵🇾'}
                    </span>
                </div>
                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" initialRange={dateRange} />
            </div>

            {data.isLoaded && (
                <div className="flex flex-col gap-8">
                    <StatCards stats={data.stats} />

                    {/* Sub-abas */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 rounded-2xl p-1.5 w-fit">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="material-icons-round text-base">{tab.icon}</span>
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {getFilteredItems().length > 0 ? (
                        <>
                            <section className="w-full overflow-hidden">
                                <MediaReel
                                    title={`${activeTab === 'all' ? 'Vídeos Recentes' : activeTab === 'shorts' ? 'Shorts' : 'Vídeos Longos'} (${getFilteredItems().length})`}
                                    items={getFilteredItems().slice(0, 25)}
                                    onItemClick={item => setSelectedItem(item)}
                                />
                            </section>
                            <ContentTable items={getFilteredItems()} />
                        </>
                    ) : (
                        <div className="text-center py-16 text-gray-400">
                            <span className="material-icons-round text-5xl mb-3 opacity-30">video_library</span>
                            <p className="text-sm">Nenhum conteúdo encontrado nesta categoria.</p>
                        </div>
                    )}
                </div>
            )}

            {!data.isLoaded && (
                <div className="p-8 text-center text-gray-500">Carregando dados...</div>
            )}

            <ContentDetailsModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
                onUpdate={(updated) => {
                    setData(prev => {
                        const update = list => list.map(i => (i.id === updated.id || i.pbId === updated.pbId) ? { ...i, ...updated } : i);
                        return { ...prev, all: update(prev.all), videos: update(prev.videos), shorts: update(prev.shorts) };
                    });
                    if (selectedItem && (selectedItem.id === updated.id || selectedItem.pbId === updated.pbId)) {
                        setSelectedItem(prev => ({ ...prev, ...updated }));
                    }
                }}
            />
        </div>
    );
};

export default YouTubeContentDashboard;
