import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatCards from '../components/dashboard/StatCards';
// import GrowthChart from '../components/dashboard/GrowthChart'; // Placeholder
import RightPanel from '../components/dashboard/RightPanel';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
// dataService needs to be imported, assuming it's available or we fix the path
import { dataService } from '../services/dataService'; // We'll double check path

const Dashboard = () => {
    const { country } = useOutletContext();
    const [stats, setStats] = useState([
        { label: 'Alcance Total', value: 0, trend: 0, icon: 'visibility', color: 'blue' },
        { label: 'Engajamento', value: 0, trend: 0, icon: 'favorite', color: 'purple' },
        { label: 'Seguidores', value: 0, trend: 0, icon: 'group', color: 'orange' },
        { label: 'Campanhas', value: 0, trend: 0, icon: 'rocket_launch', color: 'green' },
    ]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);
        return { startDate: start, endDate: end };
    });

    useEffect(() => {
        const loadAggregatedData = async () => {
            // No longer blocking as we have defaults


            setLoading(true);
            try {
                // Dynamic import logic was in App.jsx but standard import is better if possible. 
                // We will stick to standard import as written above assuming dataService exists.
                const data = await dataService.getAggregateDashboardData(country, dateRange.startDate, dateRange.endDate);

                let totalReach = 0;
                let totalEngagement = 0;
                let totalFollowers = 0;

                data.metrics.forEach(m => {
                    if (m.metric === 'reach') totalReach += m.value;
                    if (m.metric === 'interactions') totalEngagement += m.value;
                    if (m.metric === 'followers') totalFollowers += m.value;
                });

                setStats([
                    { label: 'Alcance Total', value: totalReach, trend: 12, icon: 'visibility', color: 'blue' },
                    { label: 'Engajamento', value: totalEngagement, trend: 8, icon: 'favorite', color: 'purple' },
                    { label: 'Seguidores', value: totalFollowers, trend: 5, icon: 'group', color: 'orange' },
                    { label: 'Campanhas', value: 3, trend: 0, icon: 'rocket_launch', color: 'green' },
                ]);
            } catch (e) {
                console.error("Dashboard data load error", e);
                // Fallback data for visualization if API fails (as user might not have data yet)
                setStats([
                    { label: 'Alcance Total', value: 125000, trend: 12, icon: 'visibility', color: 'blue' },
                    { label: 'Engajamento', value: 4500, trend: 8, icon: 'favorite', color: 'purple' },
                    { label: 'Seguidores', value: 1200, trend: 5, icon: 'group', color: 'orange' },
                    { label: 'Campanhas', value: 3, trend: 0, icon: 'rocket_launch', color: 'green' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadAggregatedData();
    }, [country, dateRange]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary transform rotate-3">
                        <span className="material-icons-round text-3xl">waving_hand</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Bem-vindo de volta!</h2>
                        </div>
                        <p className="text-slate-500 font-medium">Visão geral unificada de todas as suas redes.</p>
                    </div>
                </div>

                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto" />
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Left Column: Stats & Bento Grid */}
                <div className="flex-1 space-y-8">

                    {/* STATS AREA - Will be revamped in StatCards */}
                    <StatCards stats={stats} />

                    {/* New "Bento" Section for Charts/Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Chart Placeholder 1 */}
                        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 flex flex-col justify-between h-64 relative overflow-hidden group hover:shadow-premium transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="text-lg font-bold text-slate-700 z-10">Crescimento Mensal</h3>
                            <div className="flex-1 flex items-center justify-center z-10">
                                <span className="material-icons-round text-6xl text-blue-100 group-hover:scale-110 transition-transform duration-500">show_chart</span>
                            </div>
                            <div className="z-10">
                                <span className="text-sm font-bold text-green-500 flex items-center gap-1"><span className="material-icons-round text-sm">arrow_upward</span> 15%</span>
                            </div>
                        </div>

                        {/* Highlight Placeholder 2 */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-card text-white relative overflow-hidden group hover:shadow-premium hover:-translate-y-1 transition-all">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white/90">Melhor Campanha</h3>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">Ativo</span>
                                </div>
                                <div className="mt-4">
                                    <h2 className="text-3xl font-black mb-1">Black Friday</h2>
                                    <p className="text-white/70 text-sm">Alcance recorde em todas as plataformas.</p>
                                </div>
                                <div className="mt-6 flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-indigo-600"></div>
                                        <div className="w-8 h-8 rounded-full bg-red-400 border-2 border-indigo-600"></div>
                                        <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-indigo-600"></div>
                                    </div>
                                    <span className="text-xs font-bold text-white/80">+2.4k engajamentos</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Platform Mix & Feed */}
                <div className="w-full xl:w-96 space-y-6 flex-shrink-0">
                    <RightPanel platformMix={[]} />

                    {/* Example Promo Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Novas Integrações</h3>
                            <p className="text-gray-400 text-sm mb-4">Conecte mais redes para ampliar sua análise.</p>
                            <button className="px-4 py-2 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">Conectar Agora</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
