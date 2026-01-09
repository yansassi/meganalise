import React from 'react';
import { formatNumber } from '../../utils/formatters';

const StatCards = ({ stats = [] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="animate-entrance bg-white p-6 rounded-3xl shadow-card hover:shadow-premium hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden group"
                >
                    {/* Background Shine Effect */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-300
              ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : ''}
              ${stat.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : ''}
              ${stat.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : ''}
              ${stat.color === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : ''}
            `}>
                            <span className="material-icons-round text-2xl">{stat.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{formatNumber(stat.value)}</h3>
                        <div className="flex items-center mt-2">
                            {stat.trend !== 0 ? (
                                <p className={`text-xs font-bold flex items-center px-2 py-1 rounded-lg ${stat.trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    <span className="material-icons-round text-sm mr-1">
                                        {stat.trend > 0 ? 'trending_up' : 'trending_down'}
                                    </span>
                                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                </p>
                            ) : (
                                <p className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Ativo Agora</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatCards;
