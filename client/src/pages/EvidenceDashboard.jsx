import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';

const MetricCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft flex items-center gap-4 transition-transform hover:scale-[1.02]">
        <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
            <span className="material-icons-round text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value?.toLocaleString() || 0}</h3>
        </div>
    </div>
);

export default function EvidenceDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const dashboardData = await dataService.getEvidenceDashboardData(id);
                setData(dashboardData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <div className="p-10 text-center text-slate-400">Carregando dashboard...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erro: {error}</div>;
    if (!data) return <div className="p-10 text-center text-slate-400">Registro não encontrado.</div>;

    const { registry, metrics, content } = data;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft gap-4">
                <div>
                    <button
                        onClick={() => navigate('/evidence')}
                        className="text-sm font-bold text-slate-400 hover:text-blue-600 mb-2 flex items-center gap-1 transition-colors"
                    >
                        <span className="material-icons-round text-sm">arrow_back</span>
                        Voltar para Registros
                    </button>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">{registry.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                            <span className="material-icons-round text-sm">calendar_today</span>
                            {new Date(registry.start_date).toLocaleDateString()} - {new Date(registry.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                            <span className="material-icons-round text-sm">tag</span>
                            {registry.keywords?.join(', ')}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <span className="material-icons-round">print</span>
                        Imprimir Relatório
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Encontrado"
                    value={metrics.total_posts}
                    icon="manage_search"
                    color="bg-blue-600"
                />
                <MetricCard
                    title="Interações Totais"
                    value={metrics.total_interactions}
                    icon="touch_app"
                    color="bg-purple-600"
                />
                <MetricCard
                    title="Likes"
                    value={metrics.total_likes}
                    icon="favorite"
                    color="bg-pink-600"
                />
                <MetricCard
                    title="Comentários"
                    value={metrics.total_comments}
                    icon="chat_bubble"
                    color="bg-teal-600"
                />
            </div>

            {/* Content List */}
            <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-icons-round text-blue-600">list</span>
                        Conteúdos Identificados
                    </h2>
                </div>

                {content.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        Nenhum conteúdo encontrado com as palavras-chave neste período.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                    <th className="p-4 rounded-tl-2xl">Data</th>
                                    <th className="p-4">Conteúdo</th>
                                    <th className="p-4 text-center">Likes</th>
                                    <th className="p-4 text-center">Coment.</th>
                                    <th className="p-4 text-center">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {content.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 text-slate-500 text-sm font-medium whitespace-nowrap">
                                            {new Date(item.timestamp).toLocaleDateString()}
                                            <br />
                                            <span className="text-xs opacity-70">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="p-4 max-w-md">
                                            <div className="flex gap-4">
                                                {dataService.getContentImageUrl(item) && (
                                                    <img
                                                        src={dataService.getContentImageUrl(item)}
                                                        alt="Post thumbnail"
                                                        className="w-16 h-16 object-cover rounded-xl shadow-sm"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-slate-800 dark:text-white text-sm line-clamp-2 leading-relaxed">
                                                        {item.caption || 'Sem legenda'}
                                                    </p>
                                                    <span className="text-xs text-blue-500 font-bold mt-1 block">
                                                        {item.social_network || 'Instagram'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {item.like_count?.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {item.comments_count?.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <a
                                                href={item.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm mx-auto"
                                                title="Ver original"
                                            >
                                                <span className="material-icons-round text-lg">open_in_new</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
