import React, { useState } from 'react';
import ContentDetailsModal from './ContentDetailsModal';
import { dataService } from '../../services/dataService';
import { formatNumber } from '../../utils/formatters';

const ContentGrid = ({ items = [], title = "Conteúdo", limit = 45, showPagination = true }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);

    // Default pagination limit to 45 (9 cols * 5 rows) if not specified or large
    const itemsPerPage = limit || 45;
    const totalPages = Math.ceil(items.length / itemsPerPage);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [items.length, limit]);

    let displayedItems = items;
    if (limit || showPagination) {
        if (showPagination) {
            const startIndex = (currentPage - 1) * itemsPerPage;
            displayedItems = items.slice(startIndex, startIndex + itemsPerPage);
        } else {
            displayedItems = items.slice(0, limit);
        }
    }

    return (
        <>
            <ContentDetailsModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                // Update item in local list if needed? For now just viewing/editing item propagates via refetch or parent.
                // But ContentDetailsModal doesn't automatically update parent list unless we pass a callback.
                // ContentTable didn't have callback, so we probably rely on parent refresh or internal mutation.
                item={selectedItem}
            />

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-slide-right w-full">
                {title && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#1F2937] tracking-tight">{title}</h3>
                        <div className="text-sm text-gray-400">
                            Exibindo {displayedItems.length} de {items.length}
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        <span className="material-icons-round text-4xl mb-2 opacity-50">grid_off</span>
                        <p>Nenhum conteúdo encontrado no período.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4">
                        {displayedItems.map((item, index) => {
                            const imageUrl = dataService.getContentImageUrl(item);

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedItem(item);
                                    }}
                                    className="group cursor-pointer"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    {/* Card Container */}
                                    <div className="aspect-[9/16] rounded-xl overflow-hidden relative shadow-md border border-gray-100 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg bg-gray-50">

                                        {/* Image or Placeholder */}
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                                    <span className="material-icons-round text-lg">add_a_photo</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 leading-tight">Adicionar Capa</span>
                                            </div>
                                        )}

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                                            <p className="text-white text-[10px] font-medium line-clamp-2">{item.title}</p>
                                        </div>

                                        {/* Type Indicator (Top Left) */}
                                        <div className="absolute top-1 left-1 flex gap-1">
                                            <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                                <span className="material-icons-round text-white text-[12px]">
                                                    {(item.platform === 'video' || item.platform === 'reel') ? 'play_arrow' :
                                                        item.platform === 'story' ? 'amp_stories' :
                                                            item.platform === 'social' ? 'camera_alt' : 'image'}
                                                </span>
                                            </div>
                                            {/* Platform Badge */}
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm ${
                                                item.social_network === 'facebook' ? 'bg-blue-600/80' :
                                                item.social_network === 'tiktok' ? 'bg-black/60' :
                                                item.social_network === 'youtube' ? 'bg-red-600/80' :
                                                'bg-pink-600/80'
                                            }`}>
                                                <span className="material-icons-round text-white text-[10px]">
                                                    {item.social_network === 'facebook' ? 'facebook' :
                                                     item.social_network === 'tiktok' ? 'music_note' :
                                                     item.social_network === 'youtube' ? 'play_circle' :
                                                     'photo_camera'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* External Link (Top Right) */}
                                        {item.permalink && (
                                            <a
                                                href={item.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 flex items-center justify-center shadow-sm transition-colors z-20"
                                                title="Abrir link original"
                                            >
                                                <span className="material-icons-round text-[14px]">open_in_new</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Metrics Footer */}
                                    <div className="mt-2 flex items-center justify-between text-gray-500 text-xs px-1">
                                        <div className="flex items-center gap-1">
                                            <span className="material-icons-round text-[12px]">visibility</span>
                                            <span className="font-bold text-gray-700">{formatNumber(item.views || item.reach || 0)}</span>
                                        </div>
                                        <span className="text-[9px] text-gray-400 font-medium">{item.date}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {showPagination && totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
                        >
                            <span className="material-icons-round">chevron_left</span>
                        </button>

                        <span className="text-sm font-bold text-gray-600">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
                        >
                            <span className="material-icons-round">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ContentGrid;
