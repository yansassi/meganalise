import React from 'react';

const RightPanel = ({ platformMix = [] }) => {
    return (
        <div className="space-y-8">
            {/* Platform Mix */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1F2937] mb-6">Mix de Plataformas</h3>
                <div className="space-y-6">
                    {platformMix.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Sem dados disponíveis</p>
                    ) : (
                        platformMix.map((platform) => (
                            <div key={platform.name} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${platform.color === 'red' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : ''}
                  ${platform.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-600' : ''}
                  ${platform.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' : ''}
                `}>
                                    <span className="material-icons-round">{platform.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-sm">{platform.name}</span>
                                        <span className="font-bold text-sm">{platform.percentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full 
                        ${platform.color === 'red' ? 'bg-red-500' : ''}
                        ${platform.color === 'pink' ? 'bg-pink-500' : ''}
                        ${platform.color === 'blue' ? 'bg-blue-600' : ''}
                      `}
                                            style={{ width: `${platform.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Notifications / Recent */}
            <div className="bg-[#2563EB] p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-lg font-bold mb-2">Dicas Pro</h3>
                <p className="text-white/80 text-sm mb-4">Otimize seu cronograma de conteúdo para melhor alcance.</p>
                <button className="w-full py-3 bg-white text-[#2563EB] font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors">
                    Ver Insights
                </button>
            </div>
        </div>
    );
};

export default RightPanel;
