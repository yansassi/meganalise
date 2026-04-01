import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl animate-fade-in z-50">
                <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <h4 className="text-2xl font-black text-gray-800 dark:text-white">
                        {formatNumber(payload[0].value)}
                    </h4>
                </div>

                {data.postsCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                {data.postsCount} Publicações
                            </p>
                            <span className="material-icons-round text-xs text-gray-400">article</span>
                        </div>
                        <div className="space-y-1">
                            {data.postTypes && Object.entries(data.postTypes).map(([type, count]) => {
                                let label = type;
                                let icon = 'help';
                                if (type === 'story') { label = 'Story'; icon = 'amp_stories'; }
                                if (type === 'video' || type === 'REEL') { label = 'Reel'; icon = 'movie'; }
                                if (type === 'image' || type === 'IMAGE') { label = 'Foto'; icon = 'image'; }
                                if (type === 'CAROUSEL_ALBUM' || type === 'carousel') { label = 'Carrossel'; icon = 'collections'; }

                                return (
                                    <div key={type} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                        <span className="material-icons-round text-[10px] opacity-70">{icon}</span>
                                        <span>{count} {label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const GrowthChart = ({ data }) => {
    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                        dy={10}
                        minTickGap={30}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                        tickFormatter={(value) => formatNumber(value)}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReach)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GrowthChart;
