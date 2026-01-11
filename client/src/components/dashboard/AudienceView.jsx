import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ActivityChart from './ActivityChart';

const AudienceView = ({ data }) => {
    if (!data) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-400">Dados de audiência não disponíveis.</p>
            </div>
        );
    }

    // Process Age/Gender Data for Pyramid
    const processAgeGender = (genderAge) => {
        // genderAge is { "18-24": { female: 20, male: 5 }, ... }
        return Object.keys(genderAge).map(age => ({
            age,
            female: genderAge[age].female,
            male: -genderAge[age].male // Negative for pyramid effect
        })).sort((a, b) => a.age.localeCompare(b.age)); // Sort by age range
    };

    const ageGenderData = processAgeGender(data.genderAge);

    // Color Helpers
    // Using simple defaults, assume CSS variables or theme handles detailed aesthetics later if needed.
    const FEMALE_COLOR = '#ec4899'; // Pink-500
    const MALE_COLOR = '#3b82f6';   // Blue-500

    // Custom Tooltip for Pyramid
    const PyramidTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-xs">
                    <p className="font-bold mb-1">{label} Anos</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="capitalize">{entry.name === 'male' ? 'Homens' : 'Mulheres'}: </span>
                            <span className="font-mono">{Math.abs(entry.value)}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Age & Gender Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-[#2563EB] bg-blue-50 p-1 rounded-lg">people</span>
                    Faixa Etária e Gênero
                </h3>

                <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                        <BarChart
                            data={ageGenderData}
                            layout="vertical"
                            barGap={0}
                            barCategoryGap="20%"
                            stackOffset="sign"
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.1} />
                            <XAxis
                                type="number"
                                hide
                                domain={[-Math.max(...ageGenderData.map(d => Math.max(d.female, Math.abs(d.male)))) * 1.2, 'auto']}
                            />
                            <YAxis
                                dataKey="age"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={50}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip content={<PyramidTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="male" fill={MALE_COLOR} stackId="a" radius={[4, 0, 0, 4]} name="Homens" />
                            <Bar dataKey="female" fill={FEMALE_COLOR} stackId="a" radius={[0, 4, 4, 0]} name="Mulheres" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div> Homens
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500"></div> Mulheres
                    </div>
                </div>
            </div>

            {/* Hourly Activity Section */}
            {data.hourlyActivity && data.hourlyActivity.length > 0 && (
                <div className="w-full">
                    <ActivityChart data={data.hourlyActivity} />
                </div>
            )}

            {/* Geo Section: Grid of Cities & Countries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Cities */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                        <span className="material-icons-round text-green-500 bg-green-50 p-1 rounded-lg">location_city</span>
                        Principais Cidades
                    </h3>
                    <div className="space-y-4">
                        {data.cities.slice(0, 5).map((city, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-sm mb-1 z-10 relative">
                                    <span className="font-medium">{city.name}</span>
                                    <span className="font-bold">{city.value}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(city.value * 2, 100)}%` }} // Scale factor for visibility if % is small
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Countries */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                        <span className="material-icons-round text-purple-500 bg-purple-50 p-1 rounded-lg">public</span>
                        Principais Países
                    </h3>
                    <div className="space-y-4">
                        {data.countries.slice(0, 5).map((country, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-sm mb-1 z-10 relative">
                                    <span className="font-medium">{country.name}</span>
                                    <span className="font-bold">{country.value}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(country.value * 2, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudienceView;
