import React, { useState, useEffect } from 'react';
import { formatNumber, formatDate } from '../../utils/formatters';
import { useOutletContext } from 'react-router-dom';
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
import { calcPreviousPeriod } from '../../utils/dateUtils';

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

import ReachInsightsModal from './ReachInsightsModal';


const PlatformView = ({ platform }) => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'audience'
    const [fbContentTab, setFbContentTab] = useState('posts'); // 'posts', 'stories', 'audience'
    const [ytContentTab, setYtContentTab] = useState('all'); // 'all', 'videos', 'shorts'
    const [audienceData, setAudienceData] = useState(null);
    const [selectedStory, setSelectedStory] = useState(null); // State for Story Modal
    const [showReachModal, setShowReachModal] = useState(false); // State for Reach Modal

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



    useEffect(() => {
        setData(prev => ({ ...prev, isLoaded: false }));
        loadFromDatabase();
    }, [country, platform, dateRange]);

    const loadFromDatabase = async () => {
        // Busca atual e período anterior em paralelo
        const prevPeriod = calcPreviousPeriod(dateRange.startDate, dateRange.endDate, dateRange.preset);

        const [dbData, prevDbData, audience] = await Promise.all([
            dataService.getDashboardData(country, platform, dateRange.startDate, dateRange.endDate),
            prevPeriod
                ? dataService.getDashboardData(country, platform, prevPeriod.startDate, prevPeriod.endDate)
                : Promise.resolve({ metrics: [], content: [] }),
            dataService.getAudienceDemographics(country, platform)
        ]);

        setAudienceData(audience);

        if (dbData.metrics.length > 0 || dbData.content.length > 0) {
            processDbData(dbData, prevDbData);
        } else {
            setData(prev => ({ ...prev, isLoaded: false }));
        }
    };

    // Calcula sum de uma métrica em dbData.metrics
    const sumMetric = (metrics, ...names) =>
        metrics.filter(m => names.includes(m.metric)).reduce((s, m) => s + m.value, 0);

    // Calcula percentual de variação com segurança
    const calcTrend = (current, previous) => {
        if (!previous || previous === 0) return null;
        const delta = ((current - previous) / previous) * 100;
        return Number(delta.toFixed(2));
    };

    const processDbData = (dbData, prevDbData = { metrics: [], content: [] }) => {
        let reach = 0, interactions = 0, followers = 0, websiteClicks = 0, profileVisits = 0, storyViews = 0;
        let impressions = 0;
        let likes = 0, comments = 0, shares = 0, saved = 0;
        let watchTimeSum = 0, ctrSum = 0, ctrCount = 0;
        let netFollowers = 0;
        let leads = 0, phoneClicks = 0;

        const followersParams = { start: null, end: null };
        const chartMap = {};
        const followersData = [];

        dbData.metrics.forEach(m => {

            if (m.metric === 'reach' || m.metric === 'impressions') reach += m.value;
            if (m.metric === 'impressions') impressions += m.value;
            if (m.metric === 'interactions') interactions += m.value;

            // YouTube Specific Mappings
            if (m.metric === 'watch_time') watchTimeSum = (watchTimeSum || 0) + m.value;
            if (m.metric === 'views') impressions += m.value; // Map Views to Impressions for consistency if needed, or use separate
            if (m.metric === 'subscribers') netFollowers += m.value;
            if (m.metric === 'ctr') {
                ctrSum = (ctrSum || 0) + m.value;
                ctrCount = (ctrCount || 0) + 1;
            }

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
            if (m.metric === 'saved' || m.metric === 'favorites') {
                saved += m.value;
                interactions += m.value;
            }

            if (m.metric === 'followers_total') {
                const d = new Date(m.date).getTime();
                if (!followersParams.start || d < followersParams.start.date) followersParams.start = { date: d, value: m.value };
                if (!followersParams.end || d > followersParams.end.date) followersParams.end = { date: d, value: m.value };
                followersData.push({ date: m.date, value: m.value });
            }
            if (m.metric === 'website_clicks' || m.metric === 'phone_clicks') phoneClicks += m.value;
            if (m.metric === 'leads') leads += m.value;
            if (m.metric === 'profile_visits') profileVisits += m.value;

            // Chart Data Mapping (GrowthChart)
            // For TikTok, we have both 'reach' and 'video_views'. To avoid double counting on the same date:
            if (m.metric === 'reach' || m.metric === 'video_views' || m.metric === 'views' || m.metric === 'impressions') {
                if (!chartMap[m.date]) chartMap[m.date] = { reach: 0, video_views: 0 };
                
                if (m.metric === 'reach') chartMap[m.date].reach = m.value;
                if (m.metric === 'video_views' || m.metric === 'views' || m.metric === 'impressions') chartMap[m.date].video_views = m.value;
            }
        });

        // Convert chartMap to array, choosing the best metric for the "value" field
        const chartData = Object.entries(chartMap).map(([date, vals]) => ({
            date,
            value: vals.reach || vals.video_views || 0 // Prefer reach if available
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // YouTube/TikTok Retention Processing
        const retentionMap = {};
        if (platform === 'TikTok' || platform === 'YouTube') {
            dbData.metrics.forEach(m => {
                const metricName = m.metric.toLowerCase();
                // TikTok mapping
                if (['total_viewers', 'new_viewers', 'returning_viewers'].includes(metricName)) {
                    if (!retentionMap[m.date]) retentionMap[m.date] = { date: m.date };
                    retentionMap[m.date][metricName] = m.value;
                }
                // YouTube mapping
                if (metricName.includes('novos_espectadores')) {
                    if (!retentionMap[m.date]) retentionMap[m.date] = { date: m.date };
                    retentionMap[m.date].new_viewers = m.value;
                }
                if (metricName.includes('espectadores_recorrentes')) {
                    if (!retentionMap[m.date]) retentionMap[m.date] = { date: m.date };
                    retentionMap[m.date].returning_viewers = m.value;
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
        if (followersParams.start && followersParams.end) {
            netFollowers = followersParams.end.value - followersParams.start.value;
        }

        // Prepare Chart Data: Prioritize Follower Growth, fallback to Reach
        let finalChartMap = chartMap;
        if (Object.keys(followerGrowthMap).length > 0) {
            finalChartMap = followerGrowthMap;
        }

        // NEW: Aggregate Post Counts & Types for Tooltip
        const postStatsMap = {};
        dbData.content.forEach(c => {
            const dateKey = c.date ? c.date.split('T')[0] : null;
            if (!dateKey) return;

            // Normalize dateKey to match chartMap keys (dbData.metrics usually have Full ISO, but let's match roughly)
            // chartMap keys come from metric.date which IS usually YYYY-MM-DDT... or just YYYY-MM-DD. 
            // In upload.js we save as ISOString. 
            // Let's assume strict string matching might fail if time differs. 
            // Better to match by YYYY-MM-DD.

            // However, existing chartMap uses full strings from DB. 
            // Let's rely on finding standard keys.

            if (!postStatsMap[dateKey]) {
                postStatsMap[dateKey] = { count: 0, types: {} };
            }
            postStatsMap[dateKey].count++;
            const type = c.platform_type || 'social';
            postStatsMap[dateKey].types[type] = (postStatsMap[dateKey].types[type] || 0) + 1;
        });

        const chartData = Object.keys(finalChartMap).sort().map(date => {
            const shortDate = date.split('T')[0];
            const postStats = postStatsMap[shortDate] || { count: 0, types: {} };

            return {
                name: date,
                value: finalChartMap[date],
                postsCount: postStats.count,
                postTypes: postStats.types
            };
        });

        let reels = [];
        let stories = [];
        let fbPosts = [];
        let fbStories = [];
        let fbVideos = [];

        const contentItems = dbData.content.map(c => {
            const item = {
                id: c.original_id,
                pbId: c.id,
                title: c.title,
                imageUrl: c.image_url,
                imageFile: c.image_file,
                platform: c.platform_type,
                manager: 'Time Social',
                date: formatDate(c.date),
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
                social_network: c.social_network || platform.toLowerCase(),
                // YouTube-specific fields
                watch_time: c.watch_time,
                subscribers: c.subscribers,
                ctr: c.ctr,
                impressions: c.impressions,
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
            if (platform === 'Facebook') {
                const isStory = c.platform_type === 'story' || c.title?.toLowerCase().startsWith('story');
                if (isStory) fbStories.push(item);
                else if (c.platform_type === 'video' || c.duration > 0) fbVideos.push(item);
                else fbPosts.push(item);
            }
            return item;
        });

        // ── Calcular métricas do período anterior ──────────────────────────────────
        const prevImpressions = sumMetric(prevDbData.metrics, 'impressions', 'video_views', 'views');
        const prevReach = sumMetric(prevDbData.metrics, 'reach');
        const prevInteractions = sumMetric(prevDbData.metrics, 'interactions', 'likes', 'comments', 'shares', 'saved', 'favorites');
        const prevProfileVisits = sumMetric(prevDbData.metrics, 'profile_visits', 'profile_views');
        const prevWebsiteClicks = sumMetric(prevDbData.metrics, 'website_clicks');
        const prevLikes = sumMetric(prevDbData.metrics, 'likes');
        const prevComments = sumMetric(prevDbData.metrics, 'comments');
        const prevShares = sumMetric(prevDbData.metrics, 'shares');
        const prevSaves = sumMetric(prevDbData.metrics, 'saved', 'favorites');

        // Calcula net followers anterior
        const prevFollowersData = prevDbData.metrics.filter(m => m.metric === 'followers_total');
        prevFollowersData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const prevNetFollowers = prevFollowersData.length >= 2
            ? prevFollowersData[prevFollowersData.length - 1].value - prevFollowersData[0].value
            : 0;

        let stats = [];

        if (platform === 'TikTok') {
            stats = [
                { label: 'Visualizações', value: impressions, trend: calcTrend(impressions, prevImpressions), icon: 'play_circle', color: 'red' },
                { label: 'Alcance', value: reach, trend: calcTrend(reach, prevReach), icon: 'radar', color: 'orange' },
                { label: 'Seguidores (Saldo)', value: netFollowers, trend: calcTrend(netFollowers, prevNetFollowers), icon: 'group_add', color: 'cyan' },
                { label: 'Visitas ao Perfil', value: profileVisits, trend: calcTrend(profileVisits, prevProfileVisits), icon: 'person_search', color: 'teal' },
                { label: 'Interações', value: interactions, trend: calcTrend(interactions, prevInteractions), icon: 'favorite_border', color: 'purple' },
                { label: 'Curtidas', value: likes, trend: calcTrend(likes, prevLikes), icon: 'favorite', color: 'pink' },
                { label: 'Comentários', value: comments, trend: calcTrend(comments, prevComments), icon: 'chat_bubble', color: 'blue' },
                { label: 'Compartilhamentos', value: shares, trend: calcTrend(shares, prevShares), icon: 'share', color: 'green' },
                { label: 'Favoritos', value: saved, trend: calcTrend(saved, prevSaves), icon: 'bookmark', color: 'orange' }
            ];

            if (data.leads > 0) stats.push({ label: 'Leads', value: data.leads, icon: 'leaderboard', color: 'indigo' });
            if (data.phoneClicks > 0) stats.push({ label: 'Cliques (Tel)', value: data.phoneClicks, icon: 'phone', color: 'blue' });
        } else if (platform === 'Facebook') {
            stats = [
                { label: 'Visualizações', value: impressions, trend: calcTrend(impressions, prevImpressions), icon: 'visibility', color: 'blue' },
                { label: 'Visualizadores', value: reach, trend: calcTrend(reach, prevReach), icon: 'groups', color: 'indigo' },
                { label: 'Interações', value: interactions, trend: calcTrend(interactions, prevInteractions), icon: 'favorite', color: 'purple' },
                { label: 'Seguidores (Saldo)', value: netFollowers, trend: calcTrend(netFollowers, prevNetFollowers), icon: 'group_add', color: 'cyan' },
                { label: 'Visitas ao Perfil', value: profileVisits, trend: calcTrend(profileVisits, prevProfileVisits), icon: 'person_search', color: 'teal' },
                { label: 'Cliques no Link', value: websiteClicks, trend: calcTrend(websiteClicks, prevWebsiteClicks), icon: 'link', color: 'orange' }
            ];
        } else if (platform === 'Instagram') {
            stats = [
                { label: 'Alcance Total', value: reach, trend: calcTrend(reach, prevReach), icon: 'visibility', color: 'blue' },
                { label: 'Visualizações', value: impressions, trend: calcTrend(impressions, prevImpressions), icon: 'trending_up', color: 'indigo' },
                { label: 'Interações', value: interactions, trend: calcTrend(interactions, prevInteractions), icon: 'favorite', color: 'purple' },
                { label: 'Seguidores (Saldo)', value: netFollowers, trend: calcTrend(netFollowers, prevNetFollowers), icon: 'group_add', color: 'green' },
                { label: 'Visitas ao Perfil', value: profileVisits, trend: calcTrend(profileVisits, prevProfileVisits), icon: 'person_search', color: 'teal' },
                { label: 'Cliques no Link', value: websiteClicks, trend: calcTrend(websiteClicks, prevWebsiteClicks), icon: 'link', color: 'orange' },
                { label: 'Views em Stories', value: storyViews, trend: null, icon: 'amp_stories', color: 'pink' }
            ];
        } else if (platform === 'YouTube') {
            const prevWatchTime = sumMetric(prevDbData.metrics, 'watch_time');
            const prevCtrMetrics = prevDbData.metrics.filter(m => m.metric === 'ctr');
            const prevCtrAvg = prevCtrMetrics.length > 0
                ? prevCtrMetrics.reduce((s, m) => s + m.value, 0) / prevCtrMetrics.length
                : 0;
            const currCtrAvg = ctrCount > 0 ? ctrSum / ctrCount : 0;
            stats = [
                { label: 'Visualizações', value: impressions, trend: calcTrend(impressions, prevImpressions), icon: 'play_circle', color: 'red' },
                { label: 'Tempo de Exibição', value: watchTimeSum, trend: calcTrend(watchTimeSum, prevWatchTime), icon: 'schedule', color: 'blue', suffix: 'h' },
                { label: 'Inscritos Ganhos', value: netFollowers, trend: calcTrend(netFollowers, prevNetFollowers), icon: 'person_add', color: 'orange' },
                { label: 'Impressões', value: reach, trend: calcTrend(reach, prevReach), icon: 'visibility', color: 'indigo' },
                { label: 'Taxa de Cliques (CTR)', value: currCtrAvg.toFixed(2), trend: calcTrend(currCtrAvg, prevCtrAvg), icon: 'touch_app', color: 'teal', suffix: '%' }
            ];
        } else {
            // Default Fallback
            stats = [
                { label: 'Alcance Total', value: reach, trend: calcTrend(reach, prevReach), icon: 'visibility', color: 'blue' },
                { label: 'Visualizações', value: impressions, trend: calcTrend(impressions, prevImpressions), icon: 'trending_up', color: 'indigo' },
                { label: 'Interações', value: interactions, trend: calcTrend(interactions, prevInteractions), icon: 'favorite', color: 'purple' },
                { label: 'Seguidores', value: netFollowers, trend: calcTrend(netFollowers, prevNetFollowers), icon: 'group', color: 'green' }
            ];
        }

        setData({
            stats,
            chartData,
            retentionData,
            contentItems,
            reels,
            stories,
            fbPosts,
            fbStories,
            fbVideos,
            netFollowers,
            reach,
            impressions,
            websiteClicks,
            profileVisits,
            saved,
            leads,
            phoneClicks,
            chartData,
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

    const handleStatCardClick = (stat) => {
        if (stat.label === 'Alcance Total') {
            setShowReachModal(true);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{platform} - Dados</h1>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-lg font-bold border border-gray-200 dark:border-white/10">
                        {country === 'BR' ? '🇧🇷' : '🇵🇾'}
                    </span>
                </div>

                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" initialRange={dateRange} />
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
                <button
                    onClick={() => setActiveTab('content')}
                    className={`pb-4 border-b-2 font-bold text-sm flex items-center transition-all ${activeTab === 'content' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Conteúdo
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
                                    <StatCards
                                        stats={data.stats}
                                        onCardClick={handleStatCardClick}
                                    />
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
                                ) : platform === 'Facebook' ? (
                                    /* Facebook specific layout */
                                    <div className="space-y-10">
                                        <div className="w-full">
                                            {/* O StatCards já foi renderizado acima na linha 546 para todas as redes */}
                                        </div>

                                        {/* Gráfico de Alcance */}
                                        {data.chartData.length > 0 && (
                                            <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                                <div className="flex items-center gap-3 mb-5">
                                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                                                        <span className="material-icons-round text-blue-500 text-lg">show_chart</span>
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-800">Evolução do Alcance</h3>
                                                </div>
                                                <div className="w-full h-[280px]">
                                                    <GrowthChart data={data.chartData} />
                                                </div>
                                            </section>
                                        )}

                                        {/* Publicações Recentes - Reel */}
                                        {(data.contentItems || []).length > 0 && (
                                            <section className="w-full overflow-hidden">
                                                <MediaReel
                                                    title="Publicações Recentes"
                                                    items={(data.contentItems || []).slice(0, 25)}
                                                    onItemClick={(item) => setSelectedStory(item)}
                                                />
                                            </section>
                                        )}

                                        {/* Tabela de Conteúdo detalhada */}
                                        <section className="w-full">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                                                    <span className="material-icons-round text-purple-500 text-lg">table_chart</span>
                                                </div>
                                                <h3 className="text-base font-bold text-gray-800">Desempenho por Publicação</h3>
                                            </div>
                                            <ContentTable items={data.contentItems} />
                                        </section>
                                    </div>
                                ) : platform === 'TikTok' ? (
                                    /* TikTok specific layout */
                                    <div className="space-y-12">
                                        {data.retentionData.length > 0 && (
                                            <div className="w-full">
                                                <RetentionChart data={data.retentionData} />
                                            </div>
                                        )}
                                        <section className="w-full overflow-hidden">
                                            <MediaReel
                                                title="Publicações Recentes"
                                                items={(data.contentItems || []).slice(0, 25)}
                                                onItemClick={(item) => setSelectedStory(item)}
                                            />
                                        </section>
                                        {data.chartData.length > 0 && (
                                            <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[350px]">
                                                <h3 className="text-lg font-bold text-[#1F2937] mb-4 px-2">Análise de Crescimento</h3>
                                                <GrowthChart data={data.chartData} />
                                            </div>
                                        )}
                                        <div className="w-full">
                                            <ContentTable items={data.contentItems} />
                                        </div>
                                    </div>
                                ) : platform === 'YouTube' ? (
                                    /* YouTube specific layout */
                                    <div className="space-y-12">
                                        {/* Retention Chart - Novos vs Recorrentes */}
                                        {data.retentionData.length > 0 && (
                                            <div className="w-full">
                                                <div className="flex items-center gap-3 mb-4 px-2">
                                                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                                                        <span className="material-icons-round text-red-500 text-lg">supervised_user_circle</span>
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-800">Comportamento do Público</h3>
                                                </div>
                                                <RetentionChart data={data.retentionData} />
                                            </div>
                                        )}

                                        {/* Evolução de Visualizações */}
                                        {data.chartData.length > 0 && (
                                            <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[350px]">
                                                <div className="flex items-center gap-3 mb-5">
                                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                                                        <span className="material-icons-round text-blue-500 text-lg">show_chart</span>
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-800">Evolução de Visualizações</h3>
                                                </div>
                                                <GrowthChart data={data.chartData} />
                                            </section>
                                        )}

                                        {/* Conteúdo mais recente do YouTube */}
                                        <section className="w-full overflow-hidden">
                                            <MediaReel
                                                title="Vídeos Recentes"
                                                items={(data.contentItems || []).slice(0, 25)}
                                                onItemClick={(item) => setSelectedStory(item)}
                                            />
                                        </section>

                                        {/* Tabela detalhada de vídeos YouTube */}
                                        <div className="w-full">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                                                    <span className="material-icons-round text-red-500 text-lg">video_library</span>
                                                </div>
                                                <h3 className="text-base font-bold text-gray-800">Desempenho dos Vídeos</h3>
                                                {data.contentItems?.length > 0 && (
                                                    <span className="ml-auto text-xs text-gray-400 font-medium">{data.contentItems.length} vídeos</span>
                                                )}
                                            </div>

                                            {data.contentItems?.length > 0 ? (
                                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="text-gray-400 text-xs uppercase font-extrabold tracking-wider border-b border-gray-100 bg-gray-50">
                                                                    <th className="pb-3 pl-5 pt-3 whitespace-nowrap">Vídeo</th>
                                                                    <th className="pb-3 px-3 pt-3 whitespace-nowrap text-right">
                                                                        <span className="material-icons-round text-xs mr-1 align-middle">play_circle</span>Views
                                                                    </th>
                                                                    <th className="pb-3 px-3 pt-3 whitespace-nowrap text-right">
                                                                        <span className="material-icons-round text-xs mr-1 align-middle">visibility</span>Impressões
                                                                    </th>
                                                                    <th className="pb-3 px-3 pt-3 whitespace-nowrap text-right">
                                                                        <span className="material-icons-round text-xs mr-1 align-middle">touch_app</span>CTR
                                                                    </th>
                                                                    <th className="pb-3 px-3 pt-3 whitespace-nowrap text-right">
                                                                        <span className="material-icons-round text-xs mr-1 align-middle">schedule</span>Exibição
                                                                    </th>
                                                                    <th className="pb-3 pr-5 pt-3 whitespace-nowrap text-right">
                                                                        <span className="material-icons-round text-xs mr-1 align-middle">person_add</span>Inscritos
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-sm">
                                                                {data.contentItems.map((item, index) => (
                                                                    <tr
                                                                        key={item.id || index}
                                                                        onClick={() => setSelectedStory(item)}
                                                                        className="group hover:bg-red-50/40 transition-colors border-b last:border-0 border-gray-100 cursor-pointer"
                                                                    >
                                                                        <td className="py-3 pl-5 max-w-[280px]">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                                    <span className="material-icons-round text-lg">smart_display</span>
                                                                                </div>
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <span className="font-semibold text-gray-800 truncate max-w-[220px]" title={item.title}>
                                                                                        {item.title || 'Sem título'}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-400">{item.date}</span>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-3 text-right font-bold text-gray-700">
                                                                            {item.views ? formatNumber(item.views) : <span className="text-gray-300">—</span>}
                                                                        </td>
                                                                        <td className="py-3 px-3 text-right font-semibold text-gray-500">
                                                                            {item.reach ? formatNumber(item.reach) : <span className="text-gray-300">—</span>}
                                                                        </td>
                                                                        <td className="py-3 px-3 text-right">
                                                                            {item.ctr != null && item.ctr > 0 ? (
                                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                                                    item.ctr >= 10 ? 'bg-green-100 text-green-700' :
                                                                                    item.ctr >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                                                                    'bg-gray-100 text-gray-500'
                                                                                }`}>
                                                                                    {Number(item.ctr).toFixed(2)}%
                                                                                </span>
                                                                            ) : <span className="text-gray-300">—</span>}
                                                                        </td>
                                                                        <td className="py-3 px-3 text-right font-semibold text-gray-500">
                                                                            {item.watch_time ? `${Number(item.watch_time).toFixed(1)}h` : <span className="text-gray-300">—</span>}
                                                                        </td>
                                                                        <td className="py-3 pr-5 text-right">
                                                                            {item.subscribers != null && item.subscribers > 0 ? (
                                                                                <span className="text-green-600 font-bold">+{formatNumber(item.subscribers)}</span>
                                                                            ) : <span className="text-gray-300">—</span>}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                                                    <span className="material-icons-round text-5xl text-gray-200 mb-3">video_library</span>
                                                    <p className="text-gray-400 text-sm">Nenhum vídeo encontrado no período selecionado.</p>
                                                    <p className="text-xs text-gray-300 mt-1">Envie o arquivo "Dados da tabela.csv" do YouTube Studio.</p>
                                                </div>
                                            )}
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

                        {activeTab === 'audience' && (
                            <AudienceView data={audienceData} />
                        )}

                        {activeTab === 'intelligence' && (
                            <DataIntelligence contentItems={data.contentItems} />
                        )}

                        {activeTab === 'content' && platform === 'Facebook' && (
                            <div className="w-full space-y-6">
                                {/* Sub-abas do Facebook: Conteúdo | Stories | Público */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 rounded-2xl p-1.5 w-fit">
                                    {[
                                        { id: 'posts', label: 'Publicações', icon: 'grid_view' },
                                        { id: 'stories', label: 'Stories', icon: 'amp_stories' },
                                        { id: 'videos', label: 'Vídeos', icon: 'play_circle' },
                                        { id: 'audience', label: 'Público', icon: 'people' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFbContentTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                fbContentTab === tab.id
                                                    ? 'bg-white dark:bg-gray-800 text-[#2563EB] shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <span className="material-icons-round text-base">{tab.icon}</span>
                                            {tab.label}
                                            {tab.id === 'posts' && data.fbPosts?.length > 0 && (
                                                <span className="ml-1 bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{data.fbPosts.length}</span>
                                            )}
                                            {tab.id === 'stories' && data.fbStories?.length > 0 && (
                                                <span className="ml-1 bg-purple-100 text-purple-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{data.fbStories.length}</span>
                                            )}
                                            {tab.id === 'videos' && data.fbVideos?.length > 0 && (
                                                <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{data.fbVideos.length}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Conteúdo de cada sub-aba */}
                                {fbContentTab === 'posts' && (
                                    <div className="space-y-6">
                                        {data.fbPosts?.length > 0 ? (
                                            <>
                                                <section className="w-full overflow-hidden">
                                                    <MediaReel
                                                        title={`Publicações (${data.fbPosts.length})`}
                                                        items={data.fbPosts.slice(0, 25)}
                                                        onItemClick={(item) => setSelectedStory(item)}
                                                    />
                                                </section>
                                                <ContentTable items={data.fbPosts} />
                                            </>
                                        ) : (
                                            <div className="text-center py-16 text-gray-400">
                                                <span className="material-icons-round text-5xl mb-3 opacity-30">grid_view</span>
                                                <p className="text-sm">Nenhuma publicação encontrada no período.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {fbContentTab === 'stories' && (
                                    <div className="space-y-6">
                                        {data.fbStories?.length > 0 ? (
                                            <>
                                                <section className="w-full overflow-hidden">
                                                    <MediaReel
                                                        title={`Stories do Facebook (${data.fbStories.length})`}
                                                        items={data.fbStories.slice(0, 25)}
                                                        onItemClick={(item) => setSelectedStory(item)}
                                                    />
                                                </section>
                                                <ContentTable items={data.fbStories} />
                                            </>
                                        ) : (
                                            <div className="text-center py-16 text-gray-400">
                                                <span className="material-icons-round text-5xl mb-3 opacity-30">amp_stories</span>
                                                <p className="text-sm font-medium">Nenhum Story encontrado no período.</p>
                                                <p className="text-xs mt-1 opacity-70">Stories são identificados automaticamente pelo tipo de conteúdo.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {fbContentTab === 'videos' && (
                                    <div className="space-y-6">
                                        {data.fbVideos?.length > 0 ? (
                                            <>
                                                <section className="w-full overflow-hidden">
                                                    <MediaReel
                                                        title={`Vídeos e Reels (${data.fbVideos.length})`}
                                                        items={data.fbVideos.slice(0, 25)}
                                                        onItemClick={(item) => setSelectedStory(item)}
                                                    />
                                                </section>
                                                <ContentTable items={data.fbVideos} />
                                            </>
                                        ) : (
                                            <div className="text-center py-16 text-gray-400">
                                                <span className="material-icons-round text-5xl mb-3 opacity-30">play_circle</span>
                                                <p className="text-sm">Nenhum vídeo encontrado no período.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {fbContentTab === 'audience' && (
                                    <AudienceView data={audienceData} />
                                )}
                            </div>
                        )}

                        {activeTab === 'content' && platform === 'YouTube' && (
                            <div className="w-full space-y-6">
                                {/* Sub-abas do YouTube */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 rounded-2xl p-1.5 w-fit">
                                    {[
                                        { id: 'all', label: 'Todos', icon: 'video_library' },
                                        { id: 'videos', label: 'Vídeos', icon: 'smart_display' },
                                        { id: 'shorts', label: 'Shorts', icon: 'smartphone' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setYtContentTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                ytContentTab === tab.id
                                                    ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <span className="material-icons-round text-base">{tab.icon}</span>
                                            {tab.label}
                                            {tab.id !== 'all' && (() => {
                                                const count = tab.id === 'videos'
                                                    ? (data.contentItems || []).filter(i => i.platform === 'video' || (i.duration && i.duration > 60)).length
                                                    : (data.contentItems || []).filter(i => i.platform === 'short' || (i.duration && i.duration <= 60 && i.duration > 0)).length;
                                                return count > 0 ? (
                                                    <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
                                                ) : null;
                                            })()}
                                        </button>
                                    ))}
                                </div>

                                {/* Conteúdo filtrado */}
                                {(() => {
                                    const allItems = data.contentItems || [];
                                    const filtered = ytContentTab === 'videos'
                                        ? allItems.filter(i => i.platform === 'video' || (i.duration && i.duration > 60))
                                        : ytContentTab === 'shorts'
                                            ? allItems.filter(i => i.platform === 'short' || (i.duration && i.duration <= 60 && i.duration > 0))
                                            : allItems;

                                    return filtered.length > 0 ? (
                                        <>
                                            <section className="w-full overflow-hidden">
                                                <MediaReel
                                                    title={`${ytContentTab === 'all' ? 'Vídeos Recentes' : ytContentTab === 'shorts' ? 'Shorts' : 'Vídeos Longos'} (${filtered.length})`}
                                                    items={filtered.slice(0, 25)}
                                                    onItemClick={(item) => setSelectedStory(item)}
                                                />
                                            </section>
                                            <ContentTable items={filtered} />
                                        </>
                                    ) : (
                                        <div className="text-center py-16 text-gray-400">
                                            <span className="material-icons-round text-5xl mb-3 opacity-30">video_library</span>
                                            <p className="text-sm">Nenhum conteúdo encontrado nesta categoria.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'content' && platform !== 'Facebook' && platform !== 'YouTube' && (
                            <div className="w-full">
                                <ContentTable items={data.contentItems} />
                            </div>
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

            {/* Modal for Reach Insights */}
            <ReachInsightsModal
                isOpen={showReachModal}
                onClose={() => setShowReachModal(false)}
                contentItems={data.contentItems}
            />
        </div>
    );
};

export default PlatformView;
