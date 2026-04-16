import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { formatNumber } from '../utils/formatters';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';

export default function Influencer() {
    const navigate = useNavigate();
    const [registries, setRegistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [influencerList, setInfluencerList] = useState([]);

    // Metrics Caches
    const [metricsCache, setMetricsCache] = useState({}); // Cache for "My Influencers" (Contract Date)
    const [rankingMetricsCache, setRankingMetricsCache] = useState({}); // Cache for Rankings (Filter Date)
    const [rankingDateRange, setRankingDateRange] = useState({ startDate: null, endDate: null });

    // Platform Filter
    const [activePlatform, setActivePlatform] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        user_handle: '',
        country: 'BR'
    });

    const fetchRegistries = async () => {
        setLoading(true);
        const data = await dataService.getEvidenceRegistries();
        const influencers = data.filter(r => r.type === 'influencer');
        setRegistries(influencers);
        setLoading(false);

        // Fetch metrics for "My Influencers" (Contract Date)
        influencers.forEach(async (reg) => {
            try {
                // Determine implicit date range if none saved? Actually registry has dates.
                const { metrics } = await dataService.calculateRegistryMetrics(reg, null, activePlatform);
                setMetricsCache(prev => ({ ...prev, [reg.id]: metrics }));
            } catch (e) {
                console.error("Failed to load metrics for", reg.title);
            }
        });
    };

    // Refetch rankings when date range changes or registries load or platform changes
    useEffect(() => {
        if (registries.length > 0) {
            // Re-fetch "My Influencers" metrics if platform changes (even if registries didn't change, we need to update cache)
            registries.forEach(async (reg) => {
                try {
                    const { metrics } = await dataService.calculateRegistryMetrics(reg, null, activePlatform);
                    setMetricsCache(prev => ({ ...prev, [reg.id]: metrics }));
                } catch (e) { console.error(e); }
            });

            if (rankingDateRange.startDate && rankingDateRange.endDate) {
                fetchRankingMetrics();
            }
        }
    }, [registries, rankingDateRange, activePlatform]);

    const fetchRankingMetrics = () => {
        registries.forEach(async (reg) => {
            try {
                // Pass override dates AND platform
                const { metrics } = await dataService.calculateRegistryMetrics(reg, rankingDateRange, activePlatform);
                setRankingMetricsCache(prev => ({ ...prev, [reg.id]: metrics }));
            } catch (e) {
                console.error("Failed to load ranking metrics for", reg.title);
            }
        });
    };

    useEffect(() => {
        fetchRegistries();
        loadInfluencerChoices();
    }, []);

    const loadInfluencerChoices = async () => {
        const data = await dataService.getInfluencers();
        setInfluencerList(data);
    };

    const handleInfluencerChoice = (infId) => {
        const inf = influencerList.find(i => i.id === infId);
        if (inf) {
            setFormData(prev => ({
                ...prev,
                title: inf.name,
                user_handle: `@${inf.handle.replace('@', '')}`,
                type: 'influencer'
            }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const handle = formData.user_handle.trim();
            const keywords = [handle];
            if (handle.startsWith('@')) {
                keywords.push(handle.substring(1));
            } else {
                keywords.unshift(`@${handle}`);
            }

            await dataService.saveEvidenceRegistry({
                title: formData.title,
                start_date: formData.start_date,
                end_date: formData.end_date,
                keywords: keywords,
                type: 'influencer',
                country: formData.country
            });

            setShowModal(false);
            setFormData({ title: '', start_date: '', end_date: '', user_handle: '', country: 'BR' });
            fetchRegistries();
        } catch (error) {
            alert('Erro ao salvar influencer: ' + error.message);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este influencer?')) {
            await dataService.deleteEvidenceRegistry(id);
            fetchRegistries();
        }
    };

    const handleImageUpload = async (e, registry) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await dataService.updateRegistryImage(registry.id, file);
            fetchRegistries();
        } catch (error) {
            alert('Erro ao enviar imagem: ' + error.message);
        }
    };

    // Ranking Helpers
    const getTop5 = (metricKey) => {
        return [...registries]
            .map(reg => ({
                ...reg,
                metricValue: rankingMetricsCache[reg.id] ? rankingMetricsCache[reg.id][metricKey] : 0,
                metrics: rankingMetricsCache[reg.id]
            }))
            .sort((a, b) => b.metricValue - a.metricValue)
            .slice(0, 5);
    };

    const topViews = getTop5('total_views');
    const topLikes = getTop5('total_likes');
    const topComments = getTop5('total_comments');

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Gestão de Influenciadores</h1>
                    <p className="text-slate-500 font-medium">Monitore menções e conteúdos de influenciadores parceiros</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
                >
                    <span className="material-icons-round">person_add</span>
                    Novo Influencer
                </button>
            </div>

            {/* Platform Filter Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1 overflow-x-auto">
                {['all', 'instagram', 'tiktok', 'facebook'].map(platform => (
                    <button
                        key={platform}
                        onClick={() => setActivePlatform(platform)}
                        className={`pb-3 px-2 text-sm font-bold capitalize transition-all border-b-2 ${activePlatform === platform
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {platform === 'all' ? 'Todos' : platform}
                    </button>
                ))}
            </div>

            {/* Section 1: Meus Influenciadores (Horizontal Scroll) */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-icons-round text-purple-600">groups</span>
                    Meus Influenciadores
                </h2>

                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x custom-scrollbar">
                    {loading ? (
                        <div className="w-full text-center py-10 text-slate-400">Carregando...</div>
                    ) : registries.length === 0 ? (
                        <div className="w-full text-center py-10 text-slate-400 bg-white dark:bg-card-dark rounded-3xl border border-dashed border-slate-200">
                            Nenhum influenciador cadastrado.
                        </div>
                    ) : (
                        registries.map(reg => {
                            const metrics = metricsCache[reg.id];
                            const imageUrl = dataService.getRegistryImageUrl(reg);

                            return (
                                <div
                                    key={reg.id}
                                    className="min-w-[280px] w-[280px] bg-white dark:bg-card-dark rounded-3xl shadow-soft hover:shadow-xl transition-all group relative border border-transparent hover:border-purple-500/20 overflow-hidden snap-start flex flex-col"
                                >
                                    {/* Top: Image & Actions */}
                                    <div className="h-40 bg-gray-50 relative group/img cursor-pointer"
                                        onClick={() => document.getElementById(`file-${reg.id}`).click()}>

                                        <input
                                            type="file"
                                            id={`file-${reg.id}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, reg)}
                                        />

                                        {imageUrl ? (
                                            <>
                                                <img src={imageUrl} alt={reg.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="material-icons-round text-white">edit</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <span className="material-icons-round text-3xl">add_a_photo</span>
                                                <span className="text-[10px] uppercase font-bold">Adicionar Foto</span>
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(e, reg.id)}
                                            className="absolute top-2 right-2 p-1.5 text-red-500 bg-white/90 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10"
                                        >
                                            <span className="material-icons-round text-sm">delete</span>
                                        </button>

                                        {/* Country Badge */}
                                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700 uppercase shadow-sm">
                                            {reg.country === 'BR' ? '🇧🇷' : '🇵🇾'}
                                        </div>
                                    </div>

                                    {/* Bottom: Info */}
                                    <div
                                        className="p-5 flex flex-col gap-3 flex-1 cursor-pointer"
                                        onClick={() => navigate(`/evidence/${reg.id}`)}
                                    >
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-1 truncate" title={reg.title}>{reg.title}</h3>
                                            <p className="text-xs text-purple-600 font-semibold truncate">{reg.keywords ? reg.keywords[0] : ''}</p>
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Período</span>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    {new Date(reg.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Views</span>
                                                <div className="flex items-center gap-1 text-slate-800 dark:text-white font-black text-sm">
                                                    <span className="material-icons-round text-purple-500 text-xs">visibility</span>
                                                    {metrics ? formatNumber(metrics.total_views) : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Section 2: Rankings (Top 5) */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-icons-round text-amber-500">emoji_events</span>
                        Top Influenciadores
                    </h2>
                    <DateRangeFilter onFilterChange={setRankingDateRange} className="w-full md:w-auto shadow-none border-none bg-transparent p-0" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Top Views */}
                    <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft p-6">
                        <h3 className="text-md font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                            <span className="material-icons-round text-blue-500">visibility</span>
                            Top Visualizações
                        </h3>
                        <div className="space-y-4">
                            {topViews.map((reg, index) => (
                                <div key={reg.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{reg.title}</p>
                                        <p className="text-[10px] text-slate-400">{reg.country === 'BR' ? '🇧🇷' : '🇵🇾'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-blue-600">{reg.metrics ? formatNumber(reg.metrics.total_views) : '-'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Views</p>
                                    </div>
                                </div>
                            ))}
                            {topViews.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Sem dados no período</div>}
                        </div>
                    </div>

                    {/* Top Likes */}
                    <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft p-6">
                        <h3 className="text-md font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                            <span className="material-icons-round text-red-500">favorite</span>
                            Top Curtidas
                        </h3>
                        <div className="space-y-4">
                            {topLikes.map((reg, index) => (
                                <div key={reg.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{reg.title}</p>
                                        <p className="text-[10px] text-slate-400">{reg.country === 'BR' ? '🇧🇷' : '🇵🇾'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-red-600">{reg.metrics ? formatNumber(reg.metrics.total_likes) : '-'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Curtidas</p>
                                    </div>
                                </div>
                            ))}
                            {topLikes.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Sem dados no período</div>}
                        </div>
                    </div>

                    {/* Top Comments */}
                    <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft p-6">
                        <h3 className="text-md font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                            <span className="material-icons-round text-sky-500">chat_bubble</span>
                            Top Comentários
                        </h3>
                        <div className="space-y-4">
                            {topComments.map((reg, index) => (
                                <div key={reg.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{reg.title}</p>
                                        <p className="text-[10px] text-slate-400">{reg.country === 'BR' ? '🇧🇷' : '🇵🇾'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-sky-600">{reg.metrics ? formatNumber(reg.metrics.total_comments) : '-'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Comentários</p>
                                    </div>
                                </div>
                            ))}
                            {topComments.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Sem dados no período</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-scale-in">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Novo Influenciador</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Selecionar Influenciador Cadastrado</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-purple-50 border border-purple-100 focus:border-purple-500 outline-none transition-all font-bold text-purple-600 appearance-none mb-4"
                                    onChange={(e) => handleInfluencerChoice(e.target.value)}
                                >
                                    <option value="">-- Escolha um influenciador --</option>
                                    {influencerList.map(inf => (
                                        <option key={inf.id} value={inf.id}>{inf.name} (@{inf.handle})</option>
                                    ))}
                                </select>

                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Nome da Análise / Campanha</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="Ex: Monitoramento Yan Casa"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Usuário (@)</label>
                                <input
                                    type="text"
                                    name="user_handle"
                                    required
                                    placeholder="Ex: @yancasa"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium"
                                    value={formData.user_handle}
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-slate-400 mt-2 ml-1">O sistema buscará menções a este usuário nas legendas.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">País / Idioma</label>
                                <select
                                    name="country"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 outline-none transition-all font-medium text-slate-600 appearance-none"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                >
                                    <option value="BR">🇧🇷 Brasil (Português)</option>
                                    <option value="BR">🇧🇷 Brasil (Português)</option>
                                    <option value="PY">🇵🇾 Paraguai (Espanhol)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Data Início</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 outline-none transition-all font-medium text-slate-600"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Data Fim</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 outline-none transition-all font-medium text-slate-600"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/30 transition-all"
                                >
                                    Cadastrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
