import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

export default function Influencer() {
    const [influencerList, setInfluencerList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', handle: '' });

    useEffect(() => {
        loadInfluencers();
    }, []);

    const loadInfluencers = async () => {
        setLoading(true);
        try {
            const data = await dataService.getInfluencers();
            setInfluencerList(data);
        } catch (error) {
            console.error('Error loading influencers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.handle) return;
        
        setIsSaving(true);
        try {
            await dataService.createInfluencer({
                name: formData.name,
                handle: formData.handle.replace('@', '').trim()
            });
            setFormData({ name: '', handle: '' });
            await loadInfluencers();
            alert('Influenciador cadastrado no banco de talentos!');
        } catch (error) {
            console.error('Error saving influencer:', error);
            alert('Erro ao salvar influenciador.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja remover este influenciador do banco de talentos? Isso não apagará os relatórios já criados.')) return;
        try {
            await dataService.deleteInfluencer(id);
            await loadInfluencers();
        } catch (error) {
            console.error('Error deleting influencer:', error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Banco de Talentos</h1>
                    <p className="text-slate-500 font-medium">Gerencie o cadastro de influenciadores para relatórios rápidos</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-2xl font-bold text-sm">
                    <span className="material-icons-round">groups</span>
                    {influencerList.length} Cadastrados
                </div>
            </div>

            {/* Cadastro Rápido */}
            <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft border border-purple-100/50">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-purple-500">person_add</span>
                    Cadastrar Novo Influenciador
                </h2>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Influenciador</label>
                        <input 
                            type="text"
                            placeholder="Ex: Neymar Jr"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Handle / @Usuário</label>
                        <input 
                            type="text"
                            placeholder="Ex: neymarjr"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                            value={formData.handle}
                            onChange={e => setFormData({ ...formData, handle: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex items-end pb-1">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full h-[52px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? 'Salvando...' : (
                                <>
                                    <span className="material-icons-round">save</span>
                                    Salvar no Banco
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista de Influenciadores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400">Carregando banco de talentos...</div>
                ) : influencerList.length === 0 ? (
                    <div className="col-span-full py-20 bg-white dark:bg-card-dark rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center gap-4">
                        <span className="material-icons-round text-6xl opacity-10">contacts</span>
                        <p className="font-medium">Nenhum influenciador cadastrado ainda.</p>
                    </div>
                ) : (
                    influencerList.map(inf => (
                        <div key={inf.id} className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft border border-transparent hover:border-purple-500/20 hover:shadow-xl transition-all group relative">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/20">
                                    {inf.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{inf.name}</h3>
                                    <p className="text-purple-600 font-black text-sm">@{inf.handle}</p>
                                </div>
                            </div>
                            
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleDelete(inf.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remover"
                                >
                                    <span className="material-icons-round text-lg">delete</span>
                                </button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>ID: {inf.id.substring(0, 8)}</span>
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    Ativo
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
