import React from 'react';

const ContentDetailsModal = ({ isOpen, onClose, item }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-card-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transform scale-100 transition-all p-0"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-card-dark z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                            ${item.platform === 'video' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : ''}
                            ${item.platform === 'social' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/20' : ''}
                            ${item.platform === 'story' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' : ''}
                        `}>
                            <span className="material-icons-round text-xl">
                                {item.platform === 'video' ? 'play_arrow' :
                                    item.platform === 'story' ? 'amp_stories' :
                                        item.platform === 'social' ? 'camera_alt' : 'lens'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Detalhes do Conteúdo</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.date} • {item.platform.toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Content Preview & Main Info */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Image/Preview */}
                        <div className="w-full md:w-1/3 aspect-[9/16] md:aspect-square bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden relative shadow-inner flex-shrink-0">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                    <span className="material-icons-round text-4xl mb-2">image</span>
                                    <span className="text-xs">Sem prévia</span>
                                </div>
                            )}

                            {item.permalink && (
                                <a
                                    href={item.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-3 right-3 p-2 bg-white/90 dark:bg-black/70 rounded-full text-primary shadow-sm hover:scale-110 transition-transform"
                                    title="Ver no Instagram"
                                >
                                    <span className="material-icons-round text-lg">open_in_new</span>
                                </a>
                            )}
                        </div>

                        {/* Title & Key Stats */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Legenda / Título</h4>
                                <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {item.title}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-1 text-gray-500">
                                        <span className="material-icons-round text-sm">trending_up</span>
                                        <span className="text-xs font-bold uppercase">Viralidade</span>
                                    </div>
                                    <div className="text-2xl font-black">{item.virality}<span className="text-sm font-medium text-gray-400">/100</span></div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-1 text-gray-500">
                                        <span className="material-icons-round text-sm">schedule</span>
                                        <span className="text-xs font-bold uppercase">Publicado em</span>
                                    </div>
                                    <div className="text-lg font-bold">{item.date}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metrics Grid */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Métricas de Desempenho</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricBox label="Alcance" value={item.reach} icon="visibility" color="text-blue-500" />
                            <MetricBox label="Visualizações" value={item.views} icon="play_circle" color="text-indigo-500" />
                            <MetricBox label="Interações" value={(item.likes || 0) + (item.shares || 0) + (item.comments || 0) + (item.saved || 0)} icon="touch_app" color="text-purple-500" />
                            <MetricBox label="Salvamentos" value={item.saved} icon="bookmark" color="text-yellow-500" />
                            <MetricBox label="Curtidas" value={item.likes} icon="favorite" color="text-pink-500" />
                            <MetricBox label="Compartilhamentos" value={item.shares} icon="share" color="text-green-500" />
                            <MetricBox label="Comentários/Resp." value={item.comments} icon="forum" color="text-cyan-500" />
                            <MetricBox label="Duração (s)" value={item.duration} icon="timer" color="text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-b-3xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 rounded-xl font-bold text-sm transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetricBox = ({ label, value, icon, color }) => (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        <div className={`mb-2 ${color}`}>
            <span className="material-icons-round text-lg opacity-80">{icon}</span>
        </div>
        <div className="text-2xl font-bold mb-0.5">{value?.toLocaleString() || 0}</div>
        <div className="text-xs text-gray-400 font-medium uppercase">{label}</div>
    </div>
);

export default ContentDetailsModal;
