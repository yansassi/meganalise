import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];

const AgeGenderChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Group by age range
    const ageRanges = {};
    data.forEach(item => {
        if (!ageRanges[item.subcategory]) {
            ageRanges[item.subcategory] = { age: item.subcategory, women: 0, men: 0 };
        }
        if (item.gender === 'women') {
            ageRanges[item.subcategory].women = item.value;
        } else if (item.gender === 'men') {
            ageRanges[item.subcategory].men = item.value;
        }
    });

    const chartData = Object.values(ageRanges);

    return (
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl flex items-center justify-center">
                    <span className="material-icons-round">people</span>
                </div>
                <h3 className="text-lg font-bold">Faixa Etária e Gênero</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="age" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => `${value}%`}
                    />
                    <Legend />
                    <Bar dataKey="women" name="Mulheres" fill="#EC4899" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="men" name="Homens" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const CitiesChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);

    return (
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
                    <span className="material-icons-round">location_city</span>
                </div>
                <h3 className="text-lg font-bold">Principais Cidades</h3>
            </div>
            <div className="space-y-3">
                {sortedData.map((city, index) => (
                    <div key={city.subcategory} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{city.subcategory}</span>
                                <span className="text-sm font-bold text-primary">{city.value}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${city.value * 10}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CountriesChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((country, index) => ({
        name: country.subcategory,
        value: country.value,
        fill: COLORS[index % COLORS.length]
    }));

    return (
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-xl flex items-center justify-center">
                    <span className="material-icons-round">public</span>
                </div>
                <h3 className="text-lg font-bold">Principais Países</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const PagesChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);

    return (
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl flex items-center justify-center">
                    <span className="material-icons-round">pages</span>
                </div>
                <h3 className="text-lg font-bold">Principais Páginas Seguidas</h3>
            </div>
            <div className="space-y-3">
                {sortedData.map((page, index) => (
                    <div key={page.subcategory} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{page.subcategory}</span>
                                <span className="text-sm font-bold text-primary">{page.value}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(page.value / 20) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const InstagramAudienceTab = () => {
    const { country } = useOutletContext();
    const [audienceData, setAudienceData] = useState({
        ageGender: [],
        cities: [],
        countries: [],
        pages: []
    });
    const [hasData, setHasData] = useState(false);
    const [lastImport, setLastImport] = useState(null);

    useEffect(() => {
        loadAudienceData();
    }, []);

    const loadAudienceData = async () => {
        try {
            const latestImport = await dataService.getLatestAudienceImport();
            if (latestImport) {
                setLastImport(latestImport);
                const [ageGender, cities, countries, pages] = await Promise.all([
                    dataService.getAudienceData('age_gender', latestImport),
                    dataService.getAudienceData('cities', latestImport),
                    dataService.getAudienceData('countries', latestImport),
                    dataService.getAudienceData('pages', latestImport)
                ]);

                setAudienceData({ ageGender, cities, countries, pages });
                setHasData(true);
            }
        } catch (error) {
            console.error('Error loading audience data:', error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Instagram - Público</h1>
                    {lastImport && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
                            Última importação: {new Date(lastImport).toLocaleDateString('pt-BR')}
                        </span>
                    )}
                </div>
            </div>

            {hasData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AgeGenderChart data={audienceData.ageGender} />
                    <CitiesChart data={audienceData.cities} />
                    <CountriesChart data={audienceData.countries} />
                    <PagesChart data={audienceData.pages} />
                </div>
            )}

            {!hasData && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl text-gray-400">people_outline</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Nenhum dado de público disponível</h3>
                    <p className="text-gray-400 text-sm">Importe o arquivo Público.csv pela aba "Geral" para visualizar os dados demográficos</p>
                </div>
            )}
        </div>
    );
};

export default InstagramAudienceTab;
