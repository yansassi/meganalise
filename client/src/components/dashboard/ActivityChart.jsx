import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../utils/formatters';

const ActivityChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Sort by hour just in case
    const sortedData = [...data].sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 text-xs">
                    <p className="font-bold mb-1 text-gray-800 dark:text-white">Horário: {label}h</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600 dark:text-gray-300">Seguidores Ativos: </span>
                        <span className="font-mono font-bold text-gray-800 dark:text-white">
                            {formatNumber(payload[0].value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-white dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 h-[400px]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-round text-blue-500 bg-blue-50 dark:bg-blue-500/20 p-1.5 rounded-xl">schedule</span>
                Atividade por Hora
            </h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                        <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(val) => `${val}h`}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(value) => formatNumber(value)}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                        <Bar
                            dataKey="value"
                            fill="#3B82F6"
                            radius={[6, 6, 0, 0]}
                            barSize={20}
                            className="drop-shadow-[0_4px_8px_rgba(59,130,246,0.3)]"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityChart;
