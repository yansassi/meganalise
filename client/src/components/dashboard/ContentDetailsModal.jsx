import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';

const ContentDetailsModal = ({ isOpen, onClose, item, onUpdate }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [isEditingImage, setIsEditingImage] = useState(false);

    // Reset state when item changes or modal opens
    useEffect(() => {
        if (isOpen && item) {
            setImageFile(null);
            setImagePreview(null);
            setUploadSuccess(false);
            setUploadedImageUrl(null);
            setIsEditingImage(false);
        }
    }, [isOpen, item]);

    // Handler para Ctrl+V
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    handleImageFile(file);
                    setIsEditingImage(true);
                    e.preventDefault();
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen]);

    const handleImageFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }
        setImageFile(file);
        setUploadSuccess(false);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleUploadImage = async () => {
        if (!imageFile || !item) return;
        setIsUploading(true);
        try {
            const recordId = safeItem.pbId || safeItem.id;
            const platform = safeItem.social_network || 'instagram';
            const result = await dataService.updateContentImage(recordId, imageFile, platform);

            if (result && result.image_file) {
                const collectionName = platform === 'tiktok' ? 'tiktok_content' : 
                                     platform === 'facebook' ? 'facebook_content' : 
                                     platform === 'youtube' ? 'youtube_content' : 'instagram_content';
                const newImageUrl = `https://auth.meganalise.pro/api/files/${collectionName}/${result.id}/${result.image_file}`;
                setUploadedImageUrl(newImageUrl);

                if (onUpdate) {
                    onUpdate({ ...item, imageFile: result.image_file, pbId: result.id });
                }
            }
            setUploadSuccess(true);
            setTimeout(() => {
                setUploadSuccess(false);
                setIsEditingImage(false);
            }, 1000);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen || !item) return null;

    // Sanitização profunda para evitar crash de toUpperCase
    const safeItem = {
        ...item,
        platform: (item.platform && typeof item.platform === 'string') ? item.platform : 'social',
        social_network: (item.social_network && typeof item.social_network === 'string') ? item.social_network : 'instagram',
        title: item.title || item.caption || 'Sem título',
        date: item.date || 'Data não disponível',
        virality: Number(item.virality) || 0,
        reach: Number(item.reach) || 0,
        views: Number(item.views) || 0,
        likes: Number(item.likes) || 0,
        shares: Number(item.shares) || 0,
        comments: Number(item.comments) || 0,
        saved: Number(item.saved) || 0,
    };

    const isFacebook = safeItem.social_network === 'facebook';
    const displayImageUrl = uploadedImageUrl || imagePreview || dataService.getContentImageUrl(safeItem);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner
                            ${(safeItem.platform === 'video' || safeItem.platform === 'reel') ? 'bg-red-50 text-red-500' : 
                              safeItem.platform === 'story' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}
                        `}>
                            <span className="material-icons-round text-3xl">
                                {(safeItem.platform === 'video' || safeItem.platform === 'reel') ? 'play_arrow' :
                                    safeItem.platform === 'story' ? 'amp_stories' : 'filter_frames'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[#1F2937] tracking-tight">Detalhes Estratégicos</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-gray-400">{safeItem.date}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{safeItem.platform.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300">
                        <span className="material-icons-round text-2xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Media Section */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-100 shadow-2xl border-8 border-white group relative">
                                {displayImageUrl ? (
                                    <img src={displayImageUrl} alt={safeItem.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <span className="material-icons-round text-7xl mb-4">photo_library</span>
                                        <p className="font-bold">Mídia indisponível</p>
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                                    <p className="text-white text-sm font-medium leading-relaxed italic">"{safeItem.title}"</p>
                                </div>
                            </div>

                            {/* Image Actions */}
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ações da Mídia</h4>
                                    {safeItem.permalink && (
                                        <a href={safeItem.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                                            Link Original <span className="material-icons-round text-sm">open_in_new</span>
                                        </a>
                                    )}
                                </div>
                                
                                {!isEditingImage ? (
                                    <button 
                                        onClick={() => setIsEditingImage(true)}
                                        className="w-full py-4 bg-white border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-600 transition-all"
                                    >
                                        <span className="material-icons-round text-xl">add_a_photo</span>
                                        Alterar Capa do Conteúdo
                                    </button>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <input 
                                            type="file" 
                                            id="file-upload" 
                                            className="hidden" 
                                            onChange={(e) => handleImageFile(e.target.files[0])}
                                            accept="image/*"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => document.getElementById('file-upload').click()}
                                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200"
                                            >
                                                Escolher Arquivo
                                            </button>
                                            <button 
                                                onClick={handleUploadImage}
                                                disabled={isUploading || !imageFile}
                                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 disabled:opacity-50"
                                            >
                                                {isUploading ? 'Salvando...' : 'Confirmar'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditingImage(false)}
                                            className="w-full text-xs font-bold text-gray-400 hover:text-red-500"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="lg:col-span-7 space-y-8">
                            {/* Headline Stats */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-[#1F2937] to-[#111827] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Alcance Estimado</p>
                                        <p className="text-4xl font-black">{safeItem.reach.toLocaleString()}</p>
                                        <div className="mt-4 flex items-center gap-1.5 text-emerald-400">
                                            <span className="material-icons-round text-xs">trending_up</span>
                                            <span className="text-[10px] font-bold">ALTA PERFORMANCE</span>
                                        </div>
                                    </div>
                                    <span className="material-icons-round absolute -right-6 -bottom-6 text-9xl opacity-5">visibility</span>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Engajamento Total</p>
                                        <p className="text-4xl font-black">{(safeItem.likes + safeItem.comments + safeItem.shares + safeItem.saved).toLocaleString()}</p>
                                        <div className="mt-4 flex items-center gap-1.5 text-blue-200">
                                            <span className="material-icons-round text-xs">favorite</span>
                                            <span className="text-[10px] font-bold">RELAÇÃO COM PÚBLICO</span>
                                        </div>
                                    </div>
                                    <span className="material-icons-round absolute -right-6 -bottom-6 text-9xl opacity-5">favorite</span>
                                </div>
                            </div>

                            {/* Detailed Grid */}
                            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Métricas Detalhadas por KPI
                                </h4>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Visualizações</p>
                                        <p className="text-xl font-black text-gray-800">{safeItem.views.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Curtidas</p>
                                        <p className="text-xl font-black text-gray-800">{safeItem.likes.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Salvamentos</p>
                                        <p className="text-xl font-black text-gray-800">{safeItem.saved.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Interações</p>
                                        <p className="text-xl font-black text-gray-800">{safeItem.comments.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-gray-200/60 grid grid-cols-2 gap-8">
                                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                                <span className="material-icons-round text-sm">psychology</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-400 uppercase">Taxa de Conversão</span>
                                        </div>
                                        <p className="text-3xl font-black text-purple-600">
                                            {safeItem.reach > 0 ? ((safeItem.views / safeItem.reach) * 100).toFixed(1) : 0}%
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1">Visitantes vs Views</p>
                                    </div>

                                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <span className="material-icons-round text-sm">rocket_launch</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-400 uppercase">Virality Score</span>
                                        </div>
                                        <p className="text-3xl font-black text-orange-600">{safeItem.virality}</p>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-orange-600 h-full rounded-full" style={{ width: `${safeItem.virality}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Evidence Action */}
                            <button 
                                onClick={() => alert('Conteúdo adicionado às evidências com sucesso!')}
                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            >
                                <span className="material-icons-round">folder_special</span>
                                ADICIONAR AO RELATÓRIO DE EVIDÊNCIAS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentDetailsModal;
