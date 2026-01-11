import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { instagramParser } from '../../services/instagramParser';
import { dataService } from '../../services/dataService';
import StatCards from './StatCards';
import GrowthChart from './GrowthChart';
import ContentTable from './ContentTable';
import MediaReel from './MediaReel'; // Updated import
import ContentDetailsModal from './ContentDetailsModal';
import DateRangeFilter from './DateRangeFilter';

import AudienceView from './AudienceView';
import DataIntelligence from './DataIntelligence';

const ProgressModal = ({ isOpen, progress, action, details }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl transform scale-100 transition-all">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl animate-spin">sync</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{action}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{details}</p>
                </div>

                <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-end">
                    <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
                </div>
            </div>
        </div>
    );
};

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        onUpload(e.dataTransfer.files);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass-card w-full max-w-2xl p-8 rounded-3xl shadow-2xl transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Importar Dados</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div
                    className={`border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300
                    ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }
                `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl">cloud_upload</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Arraste e solte arquivos CSV</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-2">
                        Carregue "Alcance.csv", "Interações.csv" ou exportações de conteúdo.
                    </p>
                    <button className="text-primary font-bold hover:underline" onClick={() => document.getElementById('modalFileInput').click()}>
                        Ou navegue pelos arquivos
                    </button>
                    <input
                        id="modalFileInput"
                        type="file"
                        multiple
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => { onUpload(e.target.files); onClose(); }}
                    />
                </div>
            </div>
        </div>
    );
};

const PlatformView = ({ platform }) => {
    const { country } = useOutletContext();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'audience'
    const [audienceData, setAudienceData] = useState(null);
    const [selectedStory, setSelectedStory] = useState(null); // State for Story Modal

    const [data, setData] = useState({
        stats: [
            { label: 'Alcance Total', value: 0, trend: 0, icon: 'visibility', color: 'blue' },
            { label: 'Interações', value: 0, trend: 0, icon: 'favorite', color: 'purple' },
            { label: 'Seguidores', value: 0, trend: 0, icon: 'group', color: 'orange' },
        ],
        chartData: [],
        contentItems: [],
        isLoaded: false
    });
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 365);
        return { startDate: start, endDate: end };
    });



    useEffect(() => {
        // if (!dateRange.startDate || !dateRange.endDate) return; // Removed blocking check
        setData(prev => ({ ...prev, isLoaded: false }));
        loadFromDatabase();
    }, [country, platform, dateRange]);

    const loadFromDatabase = async () => {
        const dbData = await dataService.getDashboardData(country, platform, dateRange.startDate, dateRange.endDate);
        const audience = await dataService.getAudienceDemographics(country, platform);
        setAudienceData(audience);

        if (dbData.metrics.length > 0 || dbData.content.length > 0) {
            processDbData(dbData);

        } else {
            setData(prev => ({ ...prev, isLoaded: false }));
        }
    };

    const processDbData = (dbData) => {
        let reach = 0, interactions = 0, followers = 0, websiteClicks = 0, profileVisits = 0, storyViews = 0;
        let impressions = 0;
        const followersParams = { start: null, end: null };
        const chartMap = {};

        const followersData = [];

        dbData.metrics.forEach(m => {
            if (m.metric === 'reach') reach += m.value;
            if (m.metric === 'impressions') impressions += m.value;
            if (m.metric === 'interactions') interactions += m.value;

            // TikTok Specific Mappings
            if (m.metric === 'video_views') impressions += m.value; // Map Video Views to Impressions
            if (m.metric === 'profile_views') profileVisits += m.value;
            if (m.metric === 'likes' || m.metric === 'comments' || m.metric === 'shares') {
                interactions += m.value;
            }
            if (m.metric === 'followers_total') {
                // For 'followers_total', it's a cumulative value, not daily gain (usually).
                // Existing logic for 'followers' assumes daily GAIN if the file was "Seguidores.csv" (which was empty/unknown).
                // But for TikTok FollowerHistory, we have 'followers_total' and 'followers_change'.
                const d = new Date(m.date).getTime();
                if (!followersParams.start || d < followersParams.start.date) followersParams.start = { date: d, value: m.value };
                if (!followersParams.end || d > followersParams.end.date) followersParams.end = { date: d, value: m.value };

                // If we want to show growth chart based on total, we keep this.
                // But wait, existing logic (line 159) pushes to followersData.
                followersData.push({ date: m.date, value: m.value });
            }
            if (m.metric === 'followers_change') {
                // Explicit daily change
                // We can use this for the bar chart if available
            }


            if (m.metric === 'followers') {
                const d = new Date(m.date).getTime();
                if (!followersParams.start || d < followersParams.start.date) followersParams.start = { date: d, value: m.value };
                if (!followersParams.end || d > followersParams.end.date) followersParams.end = { date: d, value: m.value };

                followersData.push({ date: m.date, value: m.value });
            }
            if (m.metric === 'website_clicks') websiteClicks += m.value;
            if (m.metric === 'profile_visits') profileVisits += m.value;

            if (m.metric === 'reach' || m.metric === 'video_views') {
                chartMap[m.date] = (chartMap[m.date] || 0) + m.value;
            }
        });

        // Compute Follower Growth (Delta)
        const followerGrowthMap = {};
        followersData.sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 1; i < followersData.length; i++) {
            const current = followersData[i];
            const prev = followersData[i - 1];
            // Only calculate diff if dates are consecutive? Or just diff between available points.
            // Assuming daily data points.
            const diff = current.value - prev.value;
            followerGrowthMap[current.date] = diff;
        }

        // Calculate Net Follower Growth Total
        let netFollowers = 0;
        if (followersParams.start && followersParams.end) {
            netFollowers = followersParams.end.value - followersParams.start.value;
        }

        // Prepare Chart Data: Prioritize Follower Growth, fallback to Reach
        let finalChartMap = chartMap;
        let isGrowthData = false;

        if (Object.keys(followerGrowthMap).length > 0) {
            finalChartMap = followerGrowthMap;
            isGrowthData = true;
        }

        const chartData = Object.keys(finalChartMap).sort().map(date => ({
            name: date,
            value: finalChartMap[date]
        }));

        let reels = [];
        let stories = [];

        const contentItems = dbData.content.map(c => {
            const item = {
                id: c.original_id,
                pbId: c.id, // PocketBase internal ID for updates
                title: c.title,
                imageUrl: c.image_url,
                platform: c.platform_type,
                manager: 'Time Social',
                date: new Date(c.date).toLocaleDateString('pt-BR'),
                rawDate: c.date,
                postingTime: c.posting_time,
                virality: c.virality_score,
                status: c.status,
                reach: c.reach,
                saved: c.saved,
                views: c.views,
                duration: c.duration,
                permalink: c.permalink,
                likes: c.likes,
                shares: c.shares,
                comments: c.comments
            };

            if (platform === 'Instagram') {
                const isStory = c.platform_type === 'story' || (c.platform_type === 'social' && c.title?.startsWith('Story -'));

                if (isStory) {
                    // It is a story
                    if (c.platform_type === 'story' || (c.platform_type === 'social' && c.title?.startsWith('Story -'))) {
                        storyViews += (c.views || 0);
                        stories.push(item);
                    }
                } else {
                    // It is a Reel or Feed Post
                    reels.push(item);
                }
            }
            return item;
        });

        const stats = [
            { label: 'Alcance Total', value: reach, trend: 0, icon: 'visibility', color: 'blue' },
            { label: 'Visualizações', value: impressions, trend: 0, icon: 'trending_up', color: 'indigo' }, // New Card
            { label: 'Interações', value: interactions, trend: 0, icon: 'favorite', color: 'purple' },
            { label: 'Seguidores (Saldo)', value: netFollowers, trend: 0, icon: 'group_add', color: 'green' }, // Updated Label
            { label: 'Visitas ao Perfil', value: profileVisits, trend: 0, icon: 'person_search', color: 'teal' },
            { label: 'Cliques no Link', value: websiteClicks, trend: 0, icon: 'link', color: 'orange' }
        ];

        if (platform === 'Instagram') {
            stats.push({ label: 'Views em Stories', value: storyViews, trend: 0, icon: 'amp_stories', color: 'pink' });
        }

        setData({
            stats,
            chartData,
            contentItems,
            reels,
            stories,
            isLoaded: true
        });
    };

    const handleContentUpdate = (updatedItem) => {
        // Update item in local state to reflect changes (e.g. image upload) without reload
        setData(prev => {
            const updateList = (list) => list.map(item =>
                (item.id === updatedItem.id || item.pbId === updatedItem.pbId) ? { ...item, ...updatedItem } : item
            );

            return {
                ...prev,
                stories: updateList(prev.stories),
                reels: updateList(prev.reels),
                contentItems: updateList(prev.contentItems)
            };
        });

        // Also update selected story to show immediate changes if keep open
        if (selectedStory && (selectedStory.id === updatedItem.id || selectedStory.pbId === updatedItem.pbId)) {
            setSelectedStory(prev => ({ ...prev, ...updatedItem }));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{platform} - Dados</h1>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
                        {country}
                    </span>
                </div>

                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" />
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center space-x-10 mb-8 border-b border-gray-200 pb-px">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 border-b-2 font-bold text-sm transition-all ${activeTab === 'overview' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Resumo
                </button>
                <button
                    onClick={() => setActiveTab('audience')}
                    className={`pb-4 border-b-2 font-bold text-sm flex items-center transition-all ${activeTab === 'audience' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Público
                    {audienceData && <span className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('intelligence')}
                    className={`pb-4 border-b-2 font-bold text-sm flex items-center transition-all ${activeTab === 'intelligence' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Estratégia
                    <span className="ml-2 material-icons-round text-xs text-yellow-400">bolt</span>
                </button>
            </div>

            {(!data.isLoaded && !audienceData) && (
                <div className="border-3 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl">bar_chart</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Sem dados para exibir</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-4">
                        Nenhum dado encontrado para {platform} ({country}).
                    </p>
                    <a href="/upload" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                        Ir para Enviar Métricas
                        <span className="material-icons-round text-sm">arrow_forward</span>
                    </a>
                </div>
            )}

            {(data.isLoaded || audienceData) && (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-8">
                        {activeTab === 'overview' && data.isLoaded && (
                            <>
                                <StatCards stats={data.stats} />

                                {platform === 'Instagram' ? (
                                    <div className="space-y-12">
                                        {/* 1. Stories Reel */}
                                        <section>
                                            <MediaReel
                                                title="Stories Recentes"
                                                items={data.stories || []}
                                                onItemClick={(story) => setSelectedStory(story)}
                                            />
                                        </section>

                                        {/* 2. Growth Chart (Reach/Views context) */}
                                        <section>
                                            <h3 className="text-lg font-bold text-[#1F2937] mb-4 px-2">Análise de Alcance</h3>
                                            {data.chartData.length > 0 && <GrowthChart data={data.chartData} />}
                                        </section>

                                        {/* 3. Feed/Reels Reel */}
                                        <section>
                                            <MediaReel
                                                title="Reels e Feed"
                                                items={data.reels || []}
                                                onItemClick={(item) => setSelectedStory(item)}
                                            />
                                        </section>

                                        {/* 4. Growth Chart (Interactions context - duplicated for now, ideal would be different metrics) */}
                                        {/* For now user asked for "analise de crescimento dos conteúdo", we can reuse the chart or show a different one if we had data prepared */}
                                        {/* We will reuse GrowthChart but maybe we can filter for Interactions if we compute it. */}
                                        {/* Currently GrowthChart generic. Let's show it again as requested "em baixo analise de crescimento dos conteúdo" */}
                                        <section>
                                            <h3 className="text-lg font-bold text-[#1F2937] mb-4 px-2">Análise de Crescimento (Interações)</h3>
                                            {data.chartData.length > 0 && <GrowthChart data={data.chartData} />}
                                        </section>
                                    </div>
                                ) : (
                                    <>
                                        {data.chartData.length > 0 && <GrowthChart data={data.chartData} />}
                                        <ContentTable items={data.contentItems} />
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === 'audience' && (
                            <AudienceView data={audienceData} />
                        )}

                        {activeTab === 'intelligence' && (
                            <DataIntelligence contentItems={data.contentItems} />
                        )}
                    </div>
                </div>
            )}

            {/* Modal for Story/Content Reel */}
            <ContentDetailsModal
                isOpen={!!selectedStory}
                onClose={() => setSelectedStory(null)}
                item={selectedStory}
                onUpdate={handleContentUpdate}
            />
        </div>
    );
};

export default PlatformView;
