import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const GrowthChart = ({ data = [] }) => {
    return (
        <div className="glass-card p-8 rounded-3xl shadow-soft h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-[#2D3748] dark:text-white">Análise de Crescimento</h3>
                    <p className="text-sm text-[#9CA3AF] dark:text-purple-200/60 mt-1">Crescimento mensal de seguidores</p>
                </div>
                <select className="bg-purple-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold text-[#475569] dark:text-gray-300 outline-none">
                    <option>Este Ano</option>
                    <option>Ano Passado</option>
                </select>
            </div>

            <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                    <BarChart data={data} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C4B5FD" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10B981' : '#D946EF'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GrowthChart;
