import React, { useMemo } from 'react';
import { formatNumber } from '../../utils/formatters';

const ReachInsightsModal = ({ isOpen, onClose, contentItems = [] }) => {
    if (!isOpen) return null;

    // Analyze Data for Insights
    const insights = useMemo(() => {
        if (!contentItems.length) return null;

        const dayStats = {}; // { 0: { totalReach: 0, count: 0 }, ... }
        const hourStats = {}; // { 14: { totalReach: 0, count: 0 }, ... }

        contentItems.forEach(item => {
            const date = new Date(item.rawDate); // Ensure rawDate is available and valid
            if (isNaN(date.getTime())) return;

            const day = date.getDay(); // 0 = Sunday
            // Assuming rawDate represents the posting time correctly. 
            // If postingTime string "HH:MM" exists, prefer that for hour.
            let hour = date.getHours();

            if (item.postingTime) {
                const [h] = item.postingTime.split(':');
                if (h) hour = parseInt(h, 10);
            }

            // Init Day Stats
            if (!dayStats[day]) dayStats[day] = { totalReach: 0, count: 0 };
            dayStats[day].totalReach += (item.reach || 0);
            dayStats[day].count += 1;

            // Init Hour Stats
            if (!hourStats[hour]) hourStats[hour] = { totalReach: 0, count: 0 };
            hourStats[hour].totalReach += (item.reach || 0);
            hourStats[hour].count += 1;
        });

        // Find Best Day
        let bestDay = null;
        let maxAvgReachDay = -1;
        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        Object.keys(dayStats).forEach(day => {
            const avg = dayStats[day].totalReach / dayStats[day].count;
            if (avg > maxAvgReachDay) {
                maxAvgReachDay = avg;
                bestDay = daysOfWeek[day];
            }
        });

        // Find Best Hour
        let bestHour = null;
        let maxAvgReachHour = -1;

        Object.keys(hourStats).forEach(hour => {
            const avg = hourStats[hour].totalReach / hourStats[hour].count;
            if (avg > maxAvgReachHour) {
                maxAvgReachHour = avg;
                bestHour = `${hour}h`;
            }
        });

        return {
            bestDay: bestDay || 'N/A',
            bestHour: bestHour || 'N/A',
            avgReachDay: maxAvgReachDay,
            dayStats
        };
    }, [contentItems]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <span className="material-icons-round">close</span>
                    </button>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="material-icons-round text-4xl">visibility</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Insights de Alcance</h2>
                            <p className="text-blue-100 font-medium">Análise detalhada do seu público e performance.</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Top Stats - Best Day/Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-4 group hover:bg-blue-100 transition-colors">
                            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md">
                                <span className="material-icons-round">calendar_today</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wider">Melhor Dia</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{insights?.bestDay}</h3>
                                {insights?.avgReachDay > 0 && <p className="text-xs text-slate-500">Média: {formatNumber(Math.round(insights.avgReachDay))} views</p>}
                            </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800 flex items-center gap-4 group hover:bg-purple-100 transition-colors">
                            <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-md">
                                <span className="material-icons-round">schedule</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-purple-800 dark:text-purple-200 uppercase tracking-wider">Melhor Horário</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{insights?.bestHour}</h3>
                                <p className="text-xs text-slate-500">Baseado no histórico</p>
                            </div>
                        </div>
                    </div>

                    {/* Educational / Tips Section */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-yellow-500">lightbulb</span>
                            Dicas para Aumentar seu Alcance
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <TipCard
                                icon="movie"
                                color="text-pink-500"
                                title="Aposte em Reels"
                                description="Vídeos curtos (Reels) têm 2x mais chance de viralizar para não-seguidores do que fotos estáticas."
                            />
                            <TipCard
                                icon="music_note"
                                color="text-green-500"
                                title="Use Áudios em Alta"
                                description="Utilizar músicas que estão 'trending' (setinha para cima no Instagram) aumenta a entrega do conteúdo."
                            />
                            <TipCard
                                icon="campaign"
                                color="text-blue-500"
                                title="Call to Action (CTA)"
                                description="Sempre termine seus vídeos pedindo uma ação: 'Comente o que achou', 'Envie para um amigo'. Isso aumenta o engajamento."
                            />
                            <TipCard
                                icon="timer"
                                color="text-orange-500"
                                title="Consistência é Chave"
                                description={`Seu melhor dia é ${insights?.bestDay}. Tente manter uma frequência de postagens nesses dias para fidelizar o algoritmo.`}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const TipCard = ({ icon, color, title, description }) => (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-200 transition-all">
        <span className={`material-icons-round text-2xl ${color}`}>{icon}</span>
        <div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

export default ReachInsightsModal;
