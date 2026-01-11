import React from 'react';
import { dataService } from '../../services/dataService';
import { formatNumber } from '../../utils/formatters';

const MediaReel = ({ items = [], title = "Conteúdo Recente", onItemClick }) => {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-slide-right w-full">
            <h3 className="text-lg font-bold text-[#1F2937] tracking-tight mb-6">{title}</h3>

            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <span className="material-icons-round text-4xl mb-2">amp_stories</span>
                    <p>Nenhum conteúdo encontrado no período.</p>
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar">
                    {items.map((item) => {
                        const imageUrl = dataService.getContentImageUrl(item);

                        return (
                            <div
                                key={item.id}
                                onClick={() => onItemClick(item)}
                                className="flex-shrink-0 w-[140px] group cursor-pointer snap-start"
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
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                                <span className="material-icons-round text-xl">add_a_photo</span>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600 leading-tight">Adicionar Capa</span>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                        <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                                    </div>

                                    {/* Type Indicator */}
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                        <span className="material-icons-round text-white text-[14px]">
                                            {item.platform === 'video' || item.platform === 'reel' ? 'play_arrow' :
                                                item.platform === 'story' ? 'amp_stories' : 'image'}
                                        </span>
                                    </div>
                                </div>

                                {/* Metrics Footer */}
                                <div className="mt-3 flex items-center justify-center gap-4 text-gray-500 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="material-icons-round text-[14px]">visibility</span>
                                        <span className="font-bold text-gray-700">{formatNumber(item.views || item.reach || 0)}</span>
                                    </div>
                                </div>
                                <div className="text-center mt-1">
                                    <span className="text-[10px] text-gray-400 font-medium">{item.date}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MediaReel;
