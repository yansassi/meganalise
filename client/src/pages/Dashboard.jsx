import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatCards from '../components/dashboard/StatCards';
// import GrowthChart from '../components/dashboard/GrowthChart'; // Placeholder
import RightPanel from '../components/dashboard/RightPanel';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import { dataService } from '../services/dataService'; 
import { motion } from 'framer-motion';

const pageVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.15, duration: 0.4 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
    const { country, dateRange, setDateRange } = useOutletContext();
    const [stats, setStats] = useState([
        { label: 'Alcance Total', value: 0, trend: 0, icon: 'visibility', color: 'blue' },
        { label: 'Engajamento', value: 0, trend: 0, icon: 'favorite', color: 'purple' },
        { label: 'Seguidores', value: 0, trend: 0, icon: 'group', color: 'orange' },
        { label: 'Campanhas', value: 0, trend: 0, icon: 'rocket_launch', color: 'green' },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAggregatedData = async () => {
            setLoading(true);
            try {
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
                // Fallback data for visualization se API falhar
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
        <motion.div 
            variants={pageVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-20 max-w-7xl mx-auto"
        >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 mb-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-soft flex items-center justify-center text-primary transform -rotate-6 hover:rotate-12 transition-transform duration-500 border border-white relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="material-icons-round text-3xl z-10 text-[#6C5DD3]">waving_hand</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bem-vindo de volta!</h2>
                        </div>
                        <p className="text-slate-500 font-medium">Visão geral unificada de todas as suas redes.</p>
                    </div>
                </div>

                <DateRangeFilter onFilterChange={setDateRange} className="w-full md:w-auto bento-card p-2 !shadow-sm !rounded-2xl" initialRange={dateRange} />
            </motion.div>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Left Column: Stats & Bento Grid */}
                <div className="flex-1 space-y-8">

                    {/* STATS AREA */}
                    <motion.div variants={itemVariants} className="relative">
                        <div className="absolute -inset-4 bg-[#6C5DD3]/5 blur-3xl -z-10 rounded-[3rem]" />
                        <StatCards stats={stats} />
                    </motion.div>

                    {/* Premium Bento Grid Feature Section */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* Highlight: Best Campaign (Spans 3 cols) */}
                        <div className="lg:col-span-3 bg-gradient-to-br from-[#6C5DD3] to-[#4F46E5] p-8 rounded-[2rem] shadow-premium text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            {/* Glass overlay effects */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl -ml-20 -mb-20"></div>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-round bg-white/20 p-2 rounded-xl backdrop-blur-md">stars</span>
                                        <h3 className="text-lg font-bold text-white/90">Melhor Campanha</h3>
                                    </div>
                                    <span className="px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md text-white shadow-soft">Ativa</span>
                                </div>
                                <div className="mt-4">
                                    <h2 className="text-4xl font-black mb-2 tracking-tight">Especial de Férias</h2>
                                    <p className="text-white/80 font-medium text-lg leading-relaxed max-w-sm">
                                        O engajamento subiu significativamente nas redes com o novo form factor de post.
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4 bg-white/10 p-2 pr-6 rounded-3xl backdrop-blur-sm border border-white/10 w-max">
                                        <div className="flex -space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-[#6C5DD3] shadow-inner"></div>
                                            <div className="w-10 h-10 rounded-full bg-red-400 border-2 border-[#6C5DD3] shadow-inner"></div>
                                            <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-[#6C5DD3] shadow-inner"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Acessos</span>
                                            <span className="text-sm font-black text-white">+2.4k engajamentos</span>
                                        </div>
                                    </div>
                                    <button className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-colors">
                                        <span className="material-icons-round">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chart Placeholder 1 (Spans 2 cols) */}
                        <div className="lg:col-span-2 bento-card p-8 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-700 z-10 flex items-center gap-2">
                                    <span className="material-icons-round text-[#6C5DD3]/80">trending_up</span> Crescimento
                                </h3>
                            </div>
                            <div className="flex-1 flex flex-col justify-center items-center py-6 relative z-10">
                                <span className="material-icons-round text-[5rem] text-[#6C5DD3]/10 group-hover:scale-110 group-hover:text-[#6C5DD3]/20 transition-all duration-500 mb-4">stacked_line_chart</span>
                                <div className="text-center">
                                    <span className="text-3xl font-black text-slate-800 tracking-tight">15.4%</span>
                                    <p className="text-sm font-bold text-green-500 flex items-center justify-center gap-1 mt-1">
                                        <span className="material-icons-round text-sm">arrow_upward</span> vs. último mês
                                    </p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>

                {/* Right Column: Platform Mix & Interactions */}
                <motion.div variants={itemVariants} className="w-full xl:w-96 space-y-6 flex-shrink-0">
                    <RightPanel platformMix={[]} />

                    {/* Promo/Integration Card - Glassmorphism Dark */}
                    <div className="glass-panel-dark p-8 rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                             <span className="material-icons-round text-9xl text-white">extension</span>
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-glow">
                                <span className="material-icons-round text-white">hub</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-white">Integrações Premium</h3>
                            <p className="text-gray-400 font-medium text-sm mb-6 leading-relaxed">
                                Conecte mais redes como LinkedIn e Twitter para centralizar completamente sua análise.
                            </p>
                            <button className="w-full py-3.5 bg-white text-gray-900 text-sm font-bold rounded-2xl hover:bg-gray-100 transition-colors shadow-soft">
                                Explorar Conexões
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
