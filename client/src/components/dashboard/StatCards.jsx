import React from 'react';
import { formatNumber } from '../../utils/formatters';

const StatCards = ({ stats = [] }) => {
    const getCardTheme = (color) => {
        switch (color) {
            case 'blue':
                return {
                    container: 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-200',
                    text: 'text-white',
                    subText: 'text-blue-100',
                    iconBg: 'bg-white/20 text-white',
                    trendTag: 'bg-white/20 text-white'
                };
            case 'purple':
                return {
                    container: 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-purple-200',
                    text: 'text-white',
                    subText: 'text-purple-100',
                    iconBg: 'bg-white/20 text-white',
                    trendTag: 'bg-white/20 text-white'
                };
            case 'orange':
                return {
                    container: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-200',
                    text: 'text-white',
                    subText: 'text-orange-100',
                    iconBg: 'bg-white/20 text-white',
                    trendTag: 'bg-white/20 text-white'
                };
            case 'green':
                return {
                    container: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200',
                    text: 'text-white',
                    subText: 'text-emerald-100',
                    iconBg: 'bg-white/20 text-white',
                    trendTag: 'bg-white/20 text-white'
                };
            default: // White / Fallback Theme (High Contrast)
                return {
                    container: 'bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 shadow-card',
                    text: 'text-slate-800 dark:text-white',
                    subText: 'text-slate-500 dark:text-gray-400',
                    iconBg: 'bg-slate-100 dark:bg-white/10 text-primary',
                    trendTag: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300'
                };
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
                const theme = getCardTheme(stat.color);

                return (
                    <div
                        key={stat.label}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className={`animate-entrance ${theme.container} p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group`}
                    >
                        {/* Decorative Circles - only visible on colored cards for subtle effect, masked on white */}
                        {stat.color && (
                            <>
                                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-24 h-24 rounded-full bg-black/5 blur-2xl"></div>
                            </>
                        )}

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm backdrop-blur-sm ${theme.iconBg}`}>
                                <span className="material-icons-round text-2xl">{stat.icon}</span>
                            </div>
                            <div className={`flex items-center px-2.5 py-1 rounded-lg backdrop-blur-sm ${theme.trendTag}`}>
                                {stat.trend !== 0 ? (
                                    <span className="text-xs font-black flex items-center">
                                        <span className="material-icons-round text-sm mr-1">
                                            {stat.trend > 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                        {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold opacity-80">-</span>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 mt-2">
                            <p className={`${theme.subText} text-xs font-black uppercase tracking-wider mb-1`}>{stat.label}</p>
                            <h3 className={`${theme.text} text-3xl font-black tracking-tight`}>{formatNumber(stat.value)}</h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatCards;
