import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

const Influencers = () => {
    const [influencers, setInfluencers] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', handle: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadInfluencers();
    }, []);

    const loadInfluencers = async () => {
        try {
            const data = await dataService.getInfluencers();
            setInfluencers(data);
            setIsLoaded(true);
        } catch (error) {
            console.error('Error loading influencers:', error);
            setIsLoaded(true);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.handle) return;
        
        setIsSaving(true);
        try {
            await dataService.createInfluencer(formData);
            setFormData({ name: '', handle: '' });
            setIsModalOpen(false);
            loadInfluencers();
        } catch (error) {
            console.error('Error saving influencer:', error);
            alert('Erro ao salvar influenciador.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este influenciador?')) return;
        try {
            await dataService.deleteInfluencer(id);
            loadInfluencers();
        } catch (error) {
            console.error('Error deleting influencer:', error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1F2937]">Influenciadores</h1>
                    <p className="text-gray-500 mt-1">Gerencie o cadastro de talentos para relatórios de evidência.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                >
                    <span className="material-icons-round">person_add</span>
                    Cadastrar Novo
                </button>
            </div>

            {isLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {influencers.map((inf) => (
                        <div key={inf.id} className="glass-card p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">
                                    {inf.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-[#1F2937] text-lg">{inf.name}</h3>
                                    <p className="text-blue-600 font-bold text-sm">@{inf.handle}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(inf.id)}
                                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                                <span className="material-icons-round text-sm">delete</span>
                            </button>
                        </div>
                    ))}
                    
                    {influencers.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                            <span className="material-icons-round text-5xl text-gray-300 mb-4">group_off</span>
                            <p className="text-gray-400 font-bold text-lg">Nenhum influenciador cadastrado ainda.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-20 text-center">Carregando...</div>
            )}

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black mb-6 text-[#1F2937]">Novo Influenciador</h2>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#1F2937]"
                                    placeholder="Ex: Neymar Jr"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Usuário / @</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.handle}
                                    onChange={e => setFormData({ ...formData, handle: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#1F2937]"
                                    placeholder="Ex: neymarjr"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Influencers;
