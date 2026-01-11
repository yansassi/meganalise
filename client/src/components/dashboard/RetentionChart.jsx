import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '../../utils/formatters';

const RetentionChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[400px]">
            <h3 className="text-lg font-bold text-[#1F2937] mb-6 px-2">Retenção de Audiência</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
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
                        formatter={(value) => [formatNumber(value)]}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                        type="monotone"
                        dataKey="total_viewers"
                        name="Espectadores Totais"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        strokeWidth={3}
                    />
                    <Area
                        type="monotone"
                        dataKey="new_viewers"
                        name="Novos Espectadores"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorNew)"
                        strokeWidth={3}
                    />
                    <Area
                        type="monotone"
                        dataKey="returning_viewers"
                        name="Espectadores Recorrentes"
                        stroke="#ffc658"
                        fillOpacity={1}
                        fill="url(#colorReturning)"
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RetentionChart;
