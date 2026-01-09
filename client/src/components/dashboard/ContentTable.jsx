import React, { useState } from 'react';
import ContentDetailsModal from './ContentDetailsModal';
import { dataService } from '../../services/dataService';
import { formatNumber } from '../../utils/formatters';


const ContentTable = ({ items = [], title = "Conteúdo de Melhor Desempenho", limit = null, showPagination = false }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);

    // Calculate displayed items
    const itemsPerPage = limit || items.length;
    const totalPages = Math.ceil(items.length / itemsPerPage);

    // Reset page if items change substantially (optional, but good practice)
    React.useEffect(() => {
        setCurrentPage(1);
    }, [items.length, limit]);

    // Slice items based on configuration
    let displayedItems = items;
    if (limit) {
        if (showPagination) {
            const startIndex = (currentPage - 1) * itemsPerPage;
            displayedItems = items.slice(startIndex, startIndex + itemsPerPage);
        } else {
            // Just a hard limit (like "Top 10")
            displayedItems = items.slice(0, limit);
        }
    }

    return (
        <>
            <ContentDetailsModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />

            <div className="bg-white p-8 rounded-3xl shadow-card hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col h-full animate-slide-right border border-slate-100/50">
                {title && (
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
                        {!showPagination && limit && items.length > limit && (
                            <button className="text-primary text-sm font-bold hover:underline transition-all hover:text-primary-dark">Ver Todos</button>
                        )}
                    </div>
                )}

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                                <th className="pb-5 pl-4">Conteúdo</th>
                                <th className="pb-5">Plataforma</th>
                                <th className="pb-5 text-right">Alcance</th>
                                <th className="pb-5 text-right">Visualizações</th>
                                <th className="pb-5 text-right">Salvamentos</th>
                                <th className="pb-5 text-right">Viralidade</th>
                                <th className="pb-5 text-right pr-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {displayedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-400">Nenhum conteúdo disponível</td>
                                </tr>
                            ) : (
                                displayedItems.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className="group hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50 cursor-pointer animate-entrance"
                                    >
                                        <td className="py-5 pl-2 max-w-[300px]">
                                            <div className="flex items-center gap-4">
                                                {dataService.getContentImageUrl(item) && (
                                                    <img
                                                        src={dataService.getContentImageUrl(item)}
                                                        alt={item.title}
                                                        className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                                    />
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 dark:text-white line-clamp-2" title={item.title}>{item.title}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-400">{item.date}</span>
                                                        {item.permalink && (
                                                            <a
                                                                href={item.permalink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:text-primary-dark transition-colors z-10"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="material-icons-round text-[14px]">open_in_new</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center 
                          ${item.platform === 'video' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : ''}
                          ${item.platform === 'social' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/20' : ''}
                          ${item.platform === 'story' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' : ''}
                          ${item.platform === 'camera' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : ''}
                        `}>
                                                <span className="material-icons-round text-lg">
                                                    {item.platform === 'video' ? 'play_arrow' :
                                                        item.platform === 'story' ? 'amp_stories' :
                                                            item.platform === 'social' ? 'camera_alt' : 'lens'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 text-right font-medium text-gray-600 dark:text-gray-300">
                                            {item.reach ? formatNumber(item.reach) : '-'}
                                        </td>
                                        <td className="py-5 text-right font-medium text-gray-600 dark:text-gray-300">
                                            {item.views ? formatNumber(item.views) : '-'}
                                        </td>
                                        <td className="py-5 text-right font-medium text-gray-600 dark:text-gray-300">
                                            {item.saved ? formatNumber(item.saved) : '-'}
                                        </td>
                                        <td className="py-5 text-right">
                                            <span className="font-black text-gray-800 dark:text-white">{item.virality}</span>
                                            <span className="text-gray-400">/100</span>
                                        </td>
                                        <td className="py-5 text-right pr-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${item.status === 'Completed' ? 'bg-sidebar-bg text-white dark:bg-primary shadow-glow' : ''}
                          ${item.status === 'Ongoing' ? 'bg-white border border-gray-200 text-gray-600 dark:bg-transparent dark:border-gray-600 dark:text-gray-300' : ''}
                          ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-500' : ''}
                        `}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {showPagination && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="text-sm text-gray-400">
                            Mostrando <span className="font-bold text-gray-800 dark:text-white">{displayedItems.length}</span> de <span className="font-bold text-gray-800 dark:text-white">{items.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-icons-round text-sm">chevron_left</span>
                            </button>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-icons-round text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ContentTable;
