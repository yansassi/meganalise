import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../utils/formatters';

const ActivityChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Sort by hour just in case
    const sortedData = [...data].sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[400px]">
            <h3 className="text-lg font-bold text-[#1F2937] mb-6 px-2">Atividade dos Seguidores (Por Hora)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(val) => `${val}h`}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value) => [formatNumber(value), 'Usuários Ativos']}
                        labelFormatter={(label) => `${label}h`}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;
