import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Cell, BarChart, Bar, Legend } from 'recharts';

const DataIntelligence = ({ contentItems }) => {
    // 1. Prepare Heatmap Data (Day x Hour)
    const heatmapData = useMemo(() => {
        if (!contentItems || contentItems.length === 0) return [];

        // Initialize 7 days x 24 hours grid
        // Days: 0=Sun, 1=Mon, ..., 6=Sat
        const grid = Array(7).fill(0).map(() => Array(24).fill(0).map(() => ({ count: 0, engagement: 0, totalReach: 0 })));

        contentItems.forEach(item => {
            if (!item.rawDate && !item.date) return;

            // Try to parse date
            let dateObj = null;
            if (item.rawDate) {
                dateObj = new Date(item.rawDate);
            } else if (item.date) {
                // heuristic for DD/MM/YYYY
                const parts = item.date.split('/');
                if (parts.length === 3) dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }

            if (!dateObj || isNaN(dateObj.getTime())) return;

            const dayOfWeek = dateObj.getDay(); // 0-6

            // Parse Time
            let hour = 12; // Default to noon if missing
            if (item.postingTime) {
                const timeParts = item.postingTime.split(':');
                if (timeParts.length >= 1) {
                    hour = parseInt(timeParts[0], 10);
                }
            } else {
                // If no posting time, we can't place it accurately in hour. 
                // Skip or put in "unknown"? Let's skip hour precision or spread?
                // For now, if missing, we ignore for heatmap accuracy.
                return;
            }

            if (hour < 0 || hour > 23) hour = 12;

            const engagement = (item.saved || 0) + (item.likes || 0) + (item.shares || 0) + (item.comments || 0);

            grid[dayOfWeek][hour].count += 1;
            grid[dayOfWeek][hour].engagement += engagement;
            grid[dayOfWeek][hour].totalReach += (item.reach || 0);
        });

        // Flatten for Recharts Scatter/Heatmap
        const data = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        grid.forEach((hours, dayIndex) => {
            hours.forEach((stat, hourIndex) => {
                if (stat.count > 0) {
                    data.push({
                        day: days[dayIndex],
                        dayIndex: dayIndex, // for sorting y-axis
                        hour: hourIndex,
                        value: Math.round(stat.engagement / stat.count), // metrics: avg engagement
                        count: stat.count,
                        z: stat.count // bubble size/intensity
                    });
                }
            });
        });

        return data;
    }, [contentItems]);

    // 2. Format Battle Data
    const formatBattleData = useMemo(() => {
        const stats = {
            reels: { count: 0, reach: 0, engagement: 0 },
            carousel: { count: 0, reach: 0, engagement: 0 },
            image: { count: 0, reach: 0, engagement: 0 },
            story: { count: 0, reach: 0, engagement: 0 }
        };

        contentItems.forEach(item => {
            let type = item.platform === 'reel' || item.platform === 'video' ? 'reels' :
                item.platform === 'story' ? 'story' : 'image';

            // Simplified engagement
            const engagement = (item.saved || 0) + (item.likes || 0) + (item.shares || 0); // Comments not passed in simplified view?

            stats[type].count += 1;
            stats[type].reach += (item.reach || 0);
            stats[type].engagement += engagement;
        });

        // Calculate averages
        return Object.keys(stats).map(type => ({
            name: type?.toUpperCase() || 'OUTROS',
            avgReach: stats[type].count ? Math.round(stats[type].reach / stats[type].count) : 0,
            avgEngagement: stats[type].count ? Math.round(stats[type].engagement / stats[type].count) : 0
        })).filter(s => s.avgReach > 0);
    }, [contentItems]);

    // 3. Opportunity Matrix Data
    const scatterData = useMemo(() => {
        return contentItems.map(item => ({
            x: item.reach || 0, // Reach
            y: (item.saved || 0) + (item.likes || 0), // Engagement (simplified)
            z: 100, // Bubble size
            name: item.title
        })).filter(i => i.x > 0 && i.y > 0);
    }, [contentItems]);

    if (!contentItems || contentItems.length === 0) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Heatmap Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-red-500 bg-red-50 p-1 rounded-lg">grid_on</span>
                    Heatmap de Performance (Melhores Horários)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Intensidade baseada na média de engajamento por postagem.
                </p>
                <div style={{ width: '100%', height: 350, minHeight: 350 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                        <ScatterChart
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                type="number"
                                dataKey="hour"
                                name="Hora"
                                domain={[0, 23]}
                                tickCount={12}
                                unit="h"
                                stroke="#9ca3af"
                            />
                            <YAxis
                                type="category"
                                dataKey="day"
                                name="Dia"
                                allowDuplicatedCategory={false}
                                stroke="#9ca3af"
                            />
                            <ZAxis type="number" dataKey="value" range={[50, 500]} name="Engajamento Médio" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-xs">
                                                <p className="font-bold mb-1">{data.day} às {data.hour}:00</p>
                                                <p>Posts: {data.count}</p>
                                                <p>Engajamento Médio: {data.value}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Performance" data={heatmapData} fill="#ef4444">
                                {heatmapData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`rgba(239, 68, 68, ${Math.min(0.3 + (entry.value / 100), 1)})`} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                    {heatmapData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[1px] rounded-3xl">
                            <p className="text-gray-500 font-medium">Dados de horário insuficientes. Importe conteúdo novo.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Format Battle */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-orange-500 bg-orange-50 p-1 rounded-lg">swords</span>
                    Batalha de Formatos (Média por Post)
                </h3>
                <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                        <BarChart data={formatBattleData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Legend />
                            <Bar dataKey="avgReach" name="Alcance Médio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="avgEngagement" name="Engajamento Médio" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Opportunity Matrix */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-teal-500 bg-teal-50 p-1 rounded-lg">bubble_chart</span>
                    Matriz de Oportunidade (Alcance x Engajamento)
                </h3>
                <div style={{ width: '100%', height: 400, minHeight: 400 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="x" name="Alcance" unit="" stroke="#9ca3af" />
                            <YAxis type="number" dataKey="y" name="Engajamento" unit="" stroke="#9ca3af" />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Posts" data={scatterData} fill="#ec4899">
                                {scatterData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.x > 5000 && entry.y > 200 ? '#10b981' : '#ec4899'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Verde: Alta Performance | Rosa: Normal
                    </p>
                </div>
            </div>

            {/* Note: Heatmap delayed because we lack time data in current props. */}
        </div>
    );
};

export default DataIntelligence;
