```javascript
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const GrowthChart = ({ data }) => {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-[#1F2937]">Análise de Crescimento</h3>
                    <p className="text-xs text-gray-400 font-medium">Comparativo mensal de ganhos e perdas</p>
                </div>
                <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center text-gray-600 transition-colors shadow-sm">
                    Este Ano
                    <span className="material-icons-round ml-3 text-sm text-gray-400">expand_more</span>
                </button>
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
                                <Cell key={`cell - ${ index } `} fill={entry.value >= 0 ? '#10B981' : '#D946EF'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GrowthChart;
