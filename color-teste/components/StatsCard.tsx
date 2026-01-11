
import React from 'react';
import { MetricCardData } from '../types';

const StatsCard: React.FC<MetricCardData> = ({ label, value, type, icon, large }) => {
  const getStyles = () => {
    switch (type) {
      case 'green': return 'bg-[#10B981] text-white';
      case 'purple': return 'bg-[#D946EF] text-white';
      case 'blue': return 'bg-[#3B82F6] text-white';
      case 'orange': return 'bg-[#F97316] text-white';
      case 'white': return 'bg-white text-[#1F2937] border border-gray-100 shadow-xl';
      default: return 'bg-white';
    }
  };

  const getIconBg = () => {
    if (type === 'white') return 'bg-gray-100 text-gray-600';
    return 'bg-white/20 text-white backdrop-blur-sm';
  };

  if (large) {
    return (
      <div className={`${getStyles()} rounded-2xl p-6 shadow-xl flex items-center`}>
        <div className={`${getIconBg()} w-14 h-14 rounded-full flex items-center justify-center mr-5 flex-shrink-0 transition-transform hover:scale-110`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <div>
          <h3 className={`${type === 'white' ? 'text-gray-500' : 'text-white/90'} text-xs font-bold uppercase tracking-wider mb-1`}>
            {label}
          </h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getStyles()} rounded-2xl p-5 shadow-lg relative overflow-hidden group min-h-[140px] flex flex-col justify-between`}>
      {/* Decorative large icon for colored cards */}
      {type !== 'white' && (
        <div className="absolute -bottom-4 -right-4 p-4 opacity-10 transform scale-150 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
          <i className={`${icon} text-6xl text-white`}></i>
        </div>
      )}
      
      <div className={`${getIconBg()} w-10 h-10 rounded-full flex items-center justify-center mb-3`}>
        <i className={`${icon} text-sm`}></i>
      </div>
      
      <div className="relative z-10">
        <h3 className={`${type === 'white' ? 'text-gray-500' : 'text-white/80'} text-[10px] font-bold uppercase tracking-widest mb-1`}>
          {label}
        </h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
