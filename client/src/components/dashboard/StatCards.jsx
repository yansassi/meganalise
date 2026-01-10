import React from 'react';
import { formatNumber } from '../../utils/formatters';

const StatCards = ({ stats = [] }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
                // Define gradients based on color prop
                const gradientClass =
                    stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200' :
                        stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-200' :
                            stat.color === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-200' :
                                stat.color === 'green' ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-200' :
                                    'bg-white text-slate-800'; // Fallback

                const iconBgClass = 'bg-white/20 backdrop-blur-md text-white';

                return (
                    <div
                        key={stat.label}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className={`animate-entrance ${gradientClass} p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group`}
                    >
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-24 h-24 rounded-full bg-black/5 blur-2xl"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${iconBgClass}`}>
                                <span className="material-icons-round text-2xl">{stat.icon}</span>
                            </div>
                            <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                                {stat.trend !== 0 && (
                                    <span className="text-xs font-bold flex items-center text-white">
                                        <span className="material-icons-round text-sm mr-1">
                                            {stat.trend > 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                        {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 mt-4">
                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black tracking-tight">{formatNumber(stat.value)}</h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatCards;
