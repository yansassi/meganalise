import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';

export default function Evidence() {
    const navigate = useNavigate();
    const [registries, setRegistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        keywords: '',
        country: 'BR',
        platforms: ['instagram', 'tiktok', 'facebook', 'youtube'] // todas por padrão
    });

    const fetchRegistries = async () => {
        setLoading(true);
        const data = await dataService.getEvidenceRegistries();
        // Filter out Influencer type registries
        setRegistries(data.filter(r => r.type !== 'influencer'));
        setLoading(false);
    };

    useEffect(() => {
        fetchRegistries();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlatformToggle = (platform) => {
        setFormData(prev => {
            const current = prev.platforms || [];
            return {
                ...prev,
                platforms: current.includes(platform)
                    ? current.filter(p => p !== platform)
                    : [...current, platform]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const keywordList = formData.keywords.split(',').map(k => k.trim()).filter(k => k);

            await dataService.saveEvidenceRegistry({
                ...formData,
                keywords: keywordList,
                platforms: formData.platforms || ['instagram', 'tiktok', 'facebook', 'youtube']
            });

            setShowModal(false);
            setFormData({ title: '', start_date: '', end_date: '', keywords: '', country: 'BR', platforms: ['instagram', 'tiktok', 'facebook', 'youtube'] });
            fetchRegistries();
        } catch (error) {
            alert('Erro ao salvar registro: ' + error.message);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            await dataService.deleteEvidenceRegistry(id);
            fetchRegistries();
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Evidência de Marcas/Produtos</h1>
                    <p className="text-slate-500 font-medium">Gerencie registros de monitoramento por palavras-chave</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                >
                    <span className="material-icons-round">add</span>
                    Novo Registro
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-slate-400">Carregando...</div>
                ) : registries.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                        <span className="material-icons-round text-6xl opacity-20">folder_off</span>
                        <p>Nenhum registro de evidência encontrado.</p>
                    </div>
                ) : (
                    registries.map(reg => (
                        <div
                            key={reg.id}
                            onClick={() => navigate(`/evidence/${reg.id}`)}
                            className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group relative border border-transparent hover:border-blue-500/20"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleDelete(e, reg.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <span className="material-icons-round text-lg">delete</span>
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-2xl font-bold shadow-sm">
                                        <span className="material-icons-round">folder_special</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{reg.country === 'BR' ? 'Brasil' : reg.country === 'PY' ? 'Paraguai' : reg.country}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{reg.title}</h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    {new Date(reg.start_date).toLocaleDateString()} - {new Date(reg.end_date).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {reg.keywords?.slice(0, 3).map((k, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                                        {k}
                                    </span>
                                ))}
                                {reg.keywords?.length > 3 && (
                                    <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-xs font-semibold">
                                        +{reg.keywords.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-scale-in">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Novo Registro</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Título do Registro</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="Ex: Campanha Natal 2025"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">País / Idioma</label>
                                <select
                                    name="country"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-600 appearance-none"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                >
                                    <option value="BR">Brasil (Português)</option>
                                    <option value="PY">Paraguai (Espanhol)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Data Início</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-600"
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
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-600"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Plataformas a Monitorar</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'instagram', label: 'Instagram', icon: 'photo_camera', color: 'bg-gradient-to-br from-pink-500 to-purple-600' },
                                        { id: 'tiktok', label: 'TikTok', icon: 'music_note', color: 'bg-gray-800' },
                                        { id: 'facebook', label: 'Facebook', icon: 'facebook', color: 'bg-blue-600' },
                                        { id: 'youtube', label: 'YouTube', icon: 'play_circle', color: 'bg-red-600' },
                                    ].map(p => {
                                        const selected = (formData.platforms || []).includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handlePlatformToggle(p.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${
                                                    selected
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className={`w-6 h-6 rounded-lg ${p.color} flex items-center justify-center`}>
                                                    <span className="material-icons-round text-white text-sm">{p.icon}</span>
                                                </span>
                                                {p.label}
                                                {selected && <span className="material-icons-round text-blue-500 text-sm">check_circle</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 ml-1">Selecione em quais redes sociais buscar o conteúdo.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Palavras-chave (separadas por vírgula)</label>
                                <input
                                    type="text"
                                    name="keywords"
                                    required
                                    placeholder="Ex: oferta, desconto, natal, promoção"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                    value={formData.keywords}
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-slate-400 mt-2 ml-1">O sistema buscará conteúdos que contenham qualquer uma dessas palavras.</p>
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
                                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all"
                                >
                                    Criar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
