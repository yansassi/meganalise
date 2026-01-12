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
import RetentionChart from './RetentionChart';

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
        retentionData: [],
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
        let likes = 0, comments = 0, shares = 0;

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

            if (m.metric === 'likes') {
                likes += m.value;
                interactions += m.value;
            }
            if (m.metric === 'comments') {
                comments += m.value;
                interactions += m.value;
            }
            if (m.metric === 'shares') {
                shares += m.value;
                interactions += m.value;
            }

            if (m.metric === 'followers_total') {
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

        // TikTok Retention Processing
        const retentionMap = {};
        if (platform === 'TikTok') {
            dbData.metrics.forEach(m => {
                if (['total_viewers', 'new_viewers', 'returning_viewers'].includes(m.metric)) {
                    if (!retentionMap[m.date]) retentionMap[m.date] = { date: m.date };
                    retentionMap[m.date][m.metric] = m.value;
                }
            });
        }
        const retentionData = Object.values(retentionMap).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Compute Follower Growth (Delta)
        const followerGrowthMap = {};
        followersData.sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 1; i < followersData.length; i++) {
            const current = followersData[i];
            const prev = followersData[i - 1];
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
        if (Object.keys(followerGrowthMap).length > 0) {
            finalChartMap = followerGrowthMap;
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
                pbId: c.id,
                title: c.title,
                imageUrl: c.image_url,
                imageFile: c.image_file,
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
                comments: c.comments,
                social_network: c.social_network
            };

            if (platform === 'Instagram') {
                const isStory = c.platform_type === 'story' || (c.platform_type === 'social' && c.title?.startsWith('Story -'));

                if (isStory) {
                    storyViews += (c.views || 0);
                    stories.push(item);
                } else {
                    reels.push(item);
                }
            }
            return item;
        });

        let stats = [];

        if (platform === 'TikTok') {
            stats = [
                { label: 'Visualizações', value: impressions, trend: 0, icon: 'play_circle', color: 'red' },
                { label: 'Curtidas', value: likes, trend: 0, icon: 'favorite', color: 'pink' }, // Correct order per user
                { label: 'Comentários', value: comments, trend: 0, icon: 'chat_bubble', color: 'blue' },
                { label: 'Compartilhamentos', value: shares, trend: 0, icon: 'share', color: 'green' }
                // Removed interactions/profile visits card for cleanliness if user only wanted replaced ones?
                // User said: "retirar esses (alcance, seguidores, clicks) e colocar (likes, comments, shares)"
                // But in text message: "X Removi: Alcance, Seguidores, Cliques. V Adicionei... i Mantive: Views, Visitas, Interações"
                // Let's stick to what I notified the user about: Views, Profile Visits, Interactions, Likes, Comments, Shares.
            ];
            // Re-adding the ones I said I kept:
            stats = [
                { label: 'Visualizações', value: impressions, trend: 0, icon: 'play_circle', color: 'red' },
                { label: 'Visitas ao Perfil', value: profileVisits, trend: 0, icon: 'person_search', color: 'teal' },
                { label: 'Interações', value: interactions, trend: 0, icon: 'favorite_border', color: 'purple' },
                { label: 'Curtidas', value: likes, trend: 0, icon: 'favorite', color: 'pink' },
                { label: 'Comentários', value: comments, trend: 0, icon: 'chat_bubble', color: 'blue' },
                { label: 'Compartilhamentos', value: shares, trend: 0, icon: 'share', color: 'green' }
            ];

        } else {
            // Default (Instagram)
            stats = [
                { label: 'Alcance Total', value: reach, trend: 0, icon: 'visibility', color: 'blue' },
                { label: 'Visualizações', value: impressions, trend: 0, icon: 'trending_up', color: 'indigo' },
                { label: 'Interações', value: interactions, trend: 0, icon: 'favorite', color: 'purple' },
                { label: 'Seguidores (Saldo)', value: netFollowers, trend: 0, icon: 'group_add', color: 'green' },
                { label: 'Visitas ao Perfil', value: profileVisits, trend: 0, icon: 'person_search', color: 'teal' },
                { label: 'Cliques no Link', value: websiteClicks, trend: 0, icon: 'link', color: 'orange' }
            ];
            if (platform === 'Instagram') {
                stats.push({ label: 'Views em Stories', value: storyViews, trend: 0, icon: 'amp_stories', color: 'pink' });
            }
        }

        setData({
            stats,
            chartData,
            retentionData,
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

            {/* Dashboard Content */}
            {(data.isLoaded || audienceData) && (
                <div className="flex flex-col gap-8 w-full">
                    {/* Main Content Area - Full Width */}
                    <div className="w-full space-y-8">
                        {activeTab === 'overview' && data.isLoaded && (
                            <>
                                {/* Stats Grid - Should use grid layout from component */}
                                <div className="w-full">
                                    <StatCards stats={data.stats} />
                                </div>

                                {platform === 'Instagram' ? (
                                    <div className="space-y-12 mt-8">
                                        {/* 1. Stories Reel */}
                                        <section className="w-full overflow-hidden">
                                            <MediaReel
                                                title="Stories Recentes"
                                                items={(data.stories || []).slice(0, 25)}
                                                onItemClick={(story) => setSelectedStory(story)}
                                            />
                                        </section>

                                        {/* 2. Growth Chart (Reach/Views context) */}
                                        <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-bold text-[#1F2937] mb-4 px-2">Análise de Alcance</h3>
                                            <div className="w-full h-[300px]">
                                                {data.chartData.length > 0 && <GrowthChart data={data.chartData} />}
                                            </div>
                                        </section>

                                        {/* 3. Feed/Reels Reel */}
                                        <section className="w-full overflow-hidden">
                                            <MediaReel
                                                title="Reels e Feed"
                                                items={(data.reels || []).slice(0, 25)}
                                                onItemClick={(item) => setSelectedStory(item)}
                                            />
                                        </section>

                                        {/* 4. Growth Chart (Interactions context) */}
                                        <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-bold text-[#1F2937] mb-4 px-2">Análise de Crescimento (Interações)</h3>
                                            <div className="w-full h-[300px]">
                                                {data.chartData.length > 0 && <GrowthChart data={data.chartData} />}
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <>
                                        {platform === 'TikTok' ? (
                                            /* TikTok specific layout */
                                            <div className="space-y-12">
                                                {/* Retention Chart */}
                                                {data.retentionData.length > 0 && (
                                                    <div className="w-full">
                                                        <RetentionChart data={data.retentionData} />
                                                    </div>
                                                )}

                                                {/* Content Reel (Grid View) */}
                                                <section className="w-full overflow-hidden">
                                                    <MediaReel
                                                        title="Publicações Recentes"
                                                        items={(data.contentItems || []).slice(0, 25)}
                                                        onItemClick={(item) => setSelectedStory(item)}
                                                    />
                                                </section>

                                                {/* Growth Chart */}
                                                {data.chartData.length > 0 && (
                                                    <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[350px]">
                                                        <h3 className="text-lg font-bold text-[#1F2937] mb-4 px-2">Análise de Crescimento</h3>
                                                        <GrowthChart data={data.chartData} />
                                                    </div>
                                                )}

                                                {/* Content Table (Detailed View) */}
                                                <div className="w-full">
                                                    <ContentTable items={data.contentItems} />
                                                </div>
                                            </div>
                                        ) : (
                                            /* Generic/Other Platform Fallback */
                                            <>
                                                {data.chartData.length > 0 && (
                                                    <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[350px]">
                                                        <GrowthChart data={data.chartData} />
                                                    </div>
                                                )}
                                                <div className="w-full">
                                                    <ContentTable items={data.contentItems} />
                                                </div>
                                            </>
                                        )}
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
