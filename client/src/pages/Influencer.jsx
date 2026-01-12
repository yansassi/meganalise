import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';

export default function Influencer() {
    const navigate = useNavigate();
    const [registries, setRegistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        user_handle: '',
        country: 'Brasil'
    });

    const fetchRegistries = async () => {
        setLoading(true);
        const data = await dataService.getEvidenceRegistries();
        // Filter only Influencer type registries
        setRegistries(data.filter(r => r.type === 'influencer'));
        setLoading(false);
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
            // Logic: 
            // 1. Take the user handle (e.g. "@yan")
            // 2. Generate keywords: "@yan", "yan" (optional variations)
            // 3. Save as type="influencer"

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
            setFormData({ title: '', start_date: '', end_date: '', user_handle: '', country: 'Brasil' });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-slate-400">Carregando...</div>
                ) : registries.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                        <span className="material-icons-round text-6xl opacity-20">person_off</span>
                        <p>Nenhum influenciador cadastrado.</p>
                    </div>
                ) : (
                    registries.map(reg => (
                        <div
                            key={reg.id}
                            onClick={() => navigate(`/evidence/${reg.id}`)} // Reuses Evidence Dashboard
                            className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group relative border border-transparent hover:border-purple-500/20"
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
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 text-2xl font-bold shadow-sm">
                                        <span className="material-icons-round">person</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{reg.country || 'Brasil'}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{reg.title}</h3>
                                <p className="text-sm text-purple-600 font-semibold mb-1">{reg.keywords ? reg.keywords[0] : ''}</p>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    {new Date(reg.start_date).toLocaleDateString()} - {new Date(reg.end_date).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                                    <span className="material-icons-round text-[10px]">alternate_email</span>
                                    Monitorando handle
                                </span>
                            </div>
                        </div>
                    ))
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
                                    <option value="Brasil">Brasil (Português)</option>
                                    <option value="Paraguai">Paraguai (Espanhol)</option>
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
