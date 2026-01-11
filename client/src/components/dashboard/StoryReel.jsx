import React from 'react';
import { dataService } from '../../services/dataService';
import { formatNumber } from '../../utils/formatters';

const StoryReel = ({ stories = [], onItemClick }) => {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-slide-right">
            <h3 className="text-lg font-bold text-[#1F2937] tracking-tight mb-6">Stories Recentes</h3>

            {stories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <span className="material-icons-round text-4xl mb-2">amp_stories</span>
                    <p>Nenhum story encontrado no período.</p>
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar">
                    {stories.map((story) => {
                        const imageUrl = dataService.getContentImageUrl(story);

                        return (
                            <div
                                key={story.id}
                                onClick={() => onItemClick(story)}
                                className="flex-shrink-0 w-[140px] group cursor-pointer snap-start"
                            >
                                {/* Card Container */}
                                <div className="aspect-[9/16] rounded-xl overflow-hidden relative shadow-md border border-gray-100 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg bg-gray-50">

                                    {/* Image or Placeholder */}
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={story.title}
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
                                        <p className="text-white text-xs font-medium line-clamp-2">{story.title}</p>
                                    </div>

                                    {/* Active Story Indicator (if needed) */}
                                    {/* <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white"></div> */}
                                </div>

                                {/* Metrics Footer */}
                                <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-500">
                                    <span className="material-icons-round text-sm">visibility</span>
                                    <span className="text-sm font-bold text-gray-700">{formatNumber(story.views || 0)}</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[10px] text-gray-400 font-medium">{story.date}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StoryReel;
