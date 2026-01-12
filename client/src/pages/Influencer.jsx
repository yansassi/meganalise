import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { formatNumber } from '../utils/formatters';

export default function Influencer() {
    const navigate = useNavigate();
    const [registries, setRegistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [metricsCache, setMetricsCache] = useState({}); // Cache metrics by registry ID

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

        // Fetch metrics for each influencer in background
        influencers.forEach(async (reg) => {
            try {
                const { metrics } = await dataService.calculateRegistryMetrics(reg);
                setMetricsCache(prev => ({ ...prev, [reg.id]: metrics }));
            } catch (e) {
                console.error("Failed to load metrics for", reg.title);
            }
        });
    };

    useEffect(() => {
        fetchRegistries();
    }, []);

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
                keywords.push(handle.substring(1)); // Add without @
            } else {
                keywords.unshift(`@${handle}`); // Add with @
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
            // Refresh to show new image
            fetchRegistries();
        } catch (error) {
            alert('Erro ao enviar imagem: ' + error.message);
        }
    };

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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-slate-400">Carregando...</div>
                ) : registries.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                        <span className="material-icons-round text-6xl opacity-20">person_off</span>
                        <p>Nenhum influenciador cadastrado.</p>
                    </div>
                ) : (
                    registries.map(reg => {
                        const metrics = metricsCache[reg.id];
                        const imageUrl = dataService.getRegistryImageUrl(reg);

                        return (
                            <div
                                key={reg.id}
                                className="bg-white dark:bg-card-dark rounded-3xl shadow-soft hover:shadow-xl transition-all group relative border border-transparent hover:border-purple-500/20 overflow-hidden flex"
                            >
                                {/* Left: Info & Stats (Swapped as per request: Photo Left, Info Right) 
                                    Wait, user request: "jogue as informações para a direita... lado esquerdo deixe um campo para carregar a foto"
                                    So: LEFT = PHOTO, RIGHT = INFO
                                */ }

                                {/* Left Side: Image / Upload */}
                                <div className="w-1/3 bg-gray-50 dark:bg-white/5 relative group/img cursor-pointer border-r border-gray-100 dark:border-white/5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById(`file-${reg.id}`).click();
                                    }}>

                                    <input
                                        type="file"
                                        id={`file-${reg.id}`}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, reg)}
                                    />

                                    {imageUrl ? (
                                        <>
                                            <img src={imageUrl} alt={reg.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-icons-round text-white">edit</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 p-4 text-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                                <span className="material-icons-round">add_a_photo</span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Info & Metrics */}
                                <div
                                    className="w-2/3 p-5 flex flex-col justify-between cursor-pointer"
                                    onClick={() => navigate(`/evidence/${reg.id}`)}
                                >
                                    {/* Top: Delete Button */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => handleDelete(e, reg.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors bg-white shadow-sm"
                                        >
                                            <span className="material-icons-round text-sm">delete</span>
                                        </button>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                                                {reg.country === 'BR' ? '🇧🇷' : '🇵🇾'}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-0.5 line-clamp-1" title={reg.title}>{reg.title}</h3>
                                        <p className="text-xs text-purple-600 font-semibold mb-3">{reg.keywords ? reg.keywords[0] : ''}</p>

                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase tracking-wider bg-slate-50 dark:bg-white/5 p-1.5 rounded-lg inline-block">
                                            <span className="material-icons-round text-[12px]">calendar_today</span>
                                            {new Date(reg.start_date).toLocaleDateString()} - {new Date(reg.end_date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Key Metric: Total Views */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Visualizações Totais</div>
                                        {metrics ? (
                                            <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1">
                                                <span className="material-icons-round text-purple-500 text-lg">visibility</span>
                                                {formatNumber(metrics.total_views)}
                                            </div>
                                        ) : (
                                            <div className="h-6 w-20 bg-gray-100 rounded animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-scale-in">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Novo Influenciador</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Nome do Influencer</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="Ex: Yan Casa"
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
