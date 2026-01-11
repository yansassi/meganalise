import React from 'react';
import { formatNumber } from '../../utils/formatters';

const StatCards = ({ stats = [] }) => {
    const getCardStyles = (color) => {
        switch (color) {
            case 'green':
                return {
                    container: 'bg-[#10B981] text-white',
                    iconBg: 'bg-white/20 text-white',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            case 'purple':
                return {
                    container: 'bg-[#D946EF] text-white',
                    iconBg: 'bg-white/20 text-white',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            case 'blue':
                return {
                    container: 'bg-[#3B82F6] text-white',
                    iconBg: 'bg-white/20 text-white',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            case 'orange':
                return {
                    container: 'bg-[#F97316] text-white',
                    iconBg: 'bg-white/20 text-white',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            default: // White card
                return {
                    container: 'bg-white text-[#1F2937] border border-gray-100 shadow-xl',
                    iconBg: 'bg-gray-100 text-gray-600',
                    labelText: 'text-gray-500',
                    valueText: 'text-[#1F2937]',
                    decorativeIcon: false
                };
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
                const styles = getCardStyles(stat.color);

                return (
                    <div
                        key={stat.label}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className={`animate-entrance ${styles.container} rounded-2xl p-5 shadow-lg relative overflow-hidden group min-h-[140px] flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300`}
                    >
                        {/* Decorative large icon for colored cards */}
                        {styles.decorativeIcon && (
                            <div className="absolute -bottom-4 -right-4 p-4 opacity-10 transform scale-150 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
                                <span className="material-icons-round text-6xl text-white">{stat.icon}</span>
                            </div>
                        )}

                        <div className={`${styles.iconBg} w-10 h-10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm`}>
                            <span className="material-icons-round text-sm">{stat.icon}</span>
                        </div>

                        <div className="relative z-10">
                            <h3 className={`${styles.labelText} text-[10px] font-bold uppercase tracking-widest mb-1`}>
                                {stat.label}
                            </h3>
                            <p className={`${styles.valueText} text-2xl font-bold`}>
                                {formatNumber(stat.value)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatCards;
