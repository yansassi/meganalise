import React from 'react';

const StatCards = ({ stats = [] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 border border-transparent hover:border-primary/10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center 
              ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ''}
              ${stat.color === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' : ''}
              ${stat.color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : ''}
              ${stat.color === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : ''}
            `}>
                            <span className="material-icons-round text-xl">{stat.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                    </div>

                    <div>
                        <h3 className="text-3xl font-bold">{stat.value}</h3>
                        <div className="flex items-center mt-2">
                            {stat.trend !== 0 ? (
                                <p className={`text-xs font-bold flex items-center ${stat.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <span className="material-icons-round text-sm mr-1">
                                        {stat.trend > 0 ? 'trending_up' : 'trending_down'}
                                    </span>
                                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                </p>
                            ) : (
                                <p className="text-xs font-bold text-gray-400">Ativo Agora</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatCards;
