import React from 'react';
import { formatNumber } from '../../utils/formatters';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};

const StatCards = ({ stats = [], onCardClick }) => {
    const getCardStyles = (color) => {
        switch (color) {
            case 'green':
                return {
                    container: 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/30',
                    iconBg: 'bg-white/20 text-white border border-white/30',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            case 'purple':
                return {
                    container: 'bg-gradient-to-br from-[#D946EF] to-[#C026D3] text-white shadow-lg shadow-[#D946EF]/30',
                    iconBg: 'bg-white/20 text-white border border-white/30',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            case 'blue':
                return {
                    container: 'bg-gradient-to-br from-[#6C5DD3] to-[#4F46E5] text-white shadow-lg shadow-[#6C5DD3]/30', /* Updated to Primary Brand */
                    iconBg: 'bg-white/20 text-white border border-white/30',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            case 'orange':
                return {
                    container: 'bg-gradient-to-br from-[#FF754C] to-[#EA580C] text-white shadow-lg shadow-[#FF754C]/30', /* Updated to Secondary Brand */
                    iconBg: 'bg-white/20 text-white border border-white/30',
                    labelText: 'text-white/80',
                    valueText: 'text-white',
                    decorativeIcon: true
                };
            default: // White glassy card
                return {
                    container: 'glass-panel text-[#1F2937]',
                    iconBg: 'bg-[#F5F6FA] text-[#6C5DD3]',
                    labelText: 'text-gray-500',
                    valueText: 'text-[#1F2937]',
                    decorativeIcon: false
                };
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            {stats.map((stat, index) => {
                const styles = getCardStyles(stat.color);

                return (
                    <motion.div
                        key={stat.label}
                        variants={cardVariants}
                        onClick={() => onCardClick && onCardClick(stat)}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`${styles.container} ${onCardClick ? 'cursor-pointer' : ''} rounded-3xl p-6 relative overflow-hidden group min-h-[140px] flex flex-col justify-between`}
                    >
                        {/* Interactive Glow Background */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

                        {/* Decorative large icon for colored cards */}
                        {styles.decorativeIcon && (
                            <div className="absolute -bottom-4 -right-4 p-4 opacity-10 transform scale-150 group-hover:scale-[1.6] group-hover:-rotate-6 transition-all duration-500 pointer-events-none">
                                <span className="material-icons-round text-7xl text-white">{stat.icon}</span>
                            </div>
                        )}

                        <div className={`${styles.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-sm transition-transform group-hover:scale-110 duration-300`}>
                            <span className="material-icons-round text-xl">{stat.icon}</span>
                        </div>

                        <div className="relative z-10">
                            <h3 className={`${styles.labelText} text-[11px] font-bold uppercase tracking-[0.2em] mb-1 opacity-90`}>
                                {stat.label}
                            </h3>
                            <div className="flex items-end gap-2">
                                <p className={`${styles.valueText} text-3xl font-black tracking-tight`}>
                                    {formatNumber(stat.value)}
                                </p>
                                {stat.trend > 0 && (
                                    <span className="mb-1 text-sm font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full flex items-center backdrop-blur-sm">
                                        <span className="material-icons-round text-[12px] mr-0.5">trending_up</span> {stat.trend}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

export default StatCards;
