import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const GrowthChart = ({ data = [] }) => {
    return (
        <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold">Análise de Crescimento</h3>
                    <p className="text-sm text-gray-400 mt-1">Crescimento mensal de seguidores</p>
                </div>
                <select className="bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 outline-none">
                    <option>Este Ano</option>
                    <option>Ano Passado</option>
                </select>
            </div>

            <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94A3B8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94A3B8' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Bar dataKey="value" fill="#6C5DD3" radius={[8, 8, 8, 8]} className="hover:opacity-80 transition-opacity" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GrowthChart;
