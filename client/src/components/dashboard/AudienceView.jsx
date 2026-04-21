import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ActivityChart from './ActivityChart';
import GrowthChart from './GrowthChart';

const AudienceView = ({ data }) => {
    if (!data) {
        return (
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/10 text-center">
                <p className="text-gray-400">Dados de audiência não disponíveis.</p>
            </div>
        );
    }

    // Process Age/Gender Data for Pyramid
    const processAgeGender = (genderAge) => {
        if (!genderAge) return [];
        return Object.keys(genderAge).map(age => ({
            age,
            female: genderAge[age].female,
            male: -genderAge[age].male // Negative for pyramid effect
        })).sort((a, b) => a.age.localeCompare(b.age)); // Sort by age range
    };

    const ageGenderData = processAgeGender(data.genderAge);

    // Color Helpers
    const FEMALE_COLOR = '#ec4899'; // Pink-500
    const MALE_COLOR = '#3b82f6';   // Blue-500

    // Custom Tooltip for Pyramid
    const PyramidTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 text-xs">
                    <p className="font-bold mb-1 text-gray-800 dark:text-white">{label} Anos</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="capitalize text-gray-600 dark:text-gray-300">
                                {entry.name === 'male' || entry.name === 'Homens' ? 'Homens' : 'Mulheres'}: 
                            </span>
                            <span className="font-mono font-bold text-gray-800 dark:text-white">
                                {Math.abs(entry.value).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Process Growth Data
    const growthData = (data.followersHistory || []).map(item => ({
        name: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: item.value
    }));

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            
            {/* 1. Followers Growth Section */}
            {growthData.length > 0 && (
                <div className="bg-white dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-blue-500 bg-blue-50 dark:bg-blue-500/20 p-1.5 rounded-xl">trending_up</span>
                        Crescimento de Seguidores
                    </h3>
                    <div className="h-[300px]">
                        <GrowthChart data={growthData} />
                    </div>
                </div>
            )}

            {/* 2. Age & Gender Section */}
            <div className="bg-white dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 p-1.5 rounded-xl">wc</span>
                    Público por Gênero e Idade
                </h3>

                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={ageGenderData}
                            layout="vertical"
                            stackOffset="sign"
                            margin={{ left: 0, right: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.1} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="age"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={60}
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                            />
                            <Tooltip content={<PyramidTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                            <Bar dataKey="male" fill={MALE_COLOR} stackId="a" radius={[6, 0, 0, 6]} name="Homens" barSize={20} />
                            <Bar dataKey="female" fill={FEMALE_COLOR} stackId="a" radius={[0, 6, 6, 0]} name="Mulheres" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Homens</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-pink-500 shadow-lg shadow-pink-500/30"></div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Mulheres</span>
                    </div>
                </div>
            </div>

            {/* 3. Geo Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 p-1.5 rounded-xl">location_city</span>
                        Principais Cidades
                    </h3>
                    <div className="space-y-5">
                        {data.cities.slice(0, 6).map((city, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-emerald-500 transition-colors">{city.name}</span>
                                    <span className="text-xs font-black text-gray-400 dark:text-gray-500">{city.value}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.max(2, city.value * 2)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-amber-500 bg-amber-50 dark:bg-amber-500/20 p-1.5 rounded-xl">public</span>
                        Principais Países
                    </h3>
                    <div className="space-y-5">
                        {data.countries.slice(0, 6).map((country, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-amber-500 transition-colors">{country.name}</span>
                                    <span className="text-xs font-black text-gray-400 dark:text-gray-500">{country.value}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.max(2, country.value * 2)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Similar Pages & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hourly Activity */}
                {data.hourlyActivity && data.hourlyActivity.length > 0 && (
                    <div className="md:col-span-1">
                        <ActivityChart data={data.hourlyActivity} />
                    </div>
                )}

                {/* Similar Pages */}
                {data.similarPages && data.similarPages.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-rose-500 bg-rose-50 dark:bg-rose-500/20 p-1.5 rounded-xl">favorite</span>
                            Páginas Similares (Afinidade)
                        </h3>
                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                            {data.similarPages.slice(0, 10).map((page, idx) => (
                                <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center text-rose-500 text-[10px] font-black uppercase border border-rose-500/10">
                                            {page.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{page.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{page.category || 'Página de Interesse'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-rose-500">{page.value}%</p>
                                        <div className="w-16 h-1 bg-gray-100 dark:bg-white/5 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${page.value}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudienceView;
