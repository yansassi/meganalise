import React, { useEffect, useState } from 'react';
import { formatDate } from '../utils/formatters';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import html2pdf from 'html2pdf.js';
import PDFReportTemplate from '../components/dashboard/PDFReportTemplate';

import ContentGrid from '../components/dashboard/ContentGrid';

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

const EditRegistryModal = ({ registry, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: registry.title,
        start_date: registry.start_date.split('T')[0], // Extract YYYY-MM-DD
        end_date: registry.end_date.split('T')[0],
        keywords: registry.keywords.join(', '),
        country: registry.country || 'BR',
        type: registry.type || 'keyword'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const keywordsList = formData.type === 'influencer'
            ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) // Just keep as is for edits for now
            : formData.keywords.split(',').map(k => k.trim()).filter(k => k);

        onSave({
            ...formData,
            keywords: keywordsList
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-scale-in">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Editar Registro</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Título</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Data Início</label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-600"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Data Fim</label>
                            <input
                                type="date"
                                name="end_date"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-600"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">País / Idioma</label>
                            <select
                                name="country"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-600 appearance-none"
                                value={formData.country}
                                onChange={handleChange}
                            >
                                <option value="BR">Brasil (Português)</option>
                                <option value="PY">Paraguai (Espanhol)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">{formData.type === 'influencer' ? 'Usuário / Handle' : 'Palavras-chave'}</label>
                        <input
                            type="text"
                            name="keywords"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                            value={formData.keywords}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function EvidenceDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

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

    const handleUpdate = async (updatedData) => {
        try {
            // Reload data to reflect changes
            setLoading(true);
            await dataService.saveEvidenceRegistry({ ...updatedData, id });
            const dashboardData = await dataService.getEvidenceDashboardData(id);
            setData(dashboardData);
            setShowEditModal(false);
        } catch (err) {
            alert('Erro ao atualizar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        setGeneratingPdf(true);
        const element = document.getElementById('pdf-report-content');

        const opt = {
            margin: 0,
            filename: `Relatorio-${data?.registry?.title?.replace(/[^a-z0-9]/gi, '_') || 'Evidence'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error("PDF Generation Error", err);
            alert("Erro ao gerar PDF. Tente novamente.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Carregando dashboard...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erro: {error}</div>;
    if (!data) return <div className="p-10 text-center text-slate-400">Registro não encontrado.</div>;

    const { registry, metrics, content } = data;
    const isInfluencer = registry.type === 'influencer';

    // Map content for Grid
    const contentItems = content.map(c => ({
        id: c.original_id,
        pbId: c.id,
        title: c.title,
        imageUrl: c.image_url,
        imageFile: c.image_file,
        platform: c.platform_type || 'social',
        permalink: c.permalink,
        manager: 'Time Social',
        date: formatDate(c.date),
        virality: c.virality_score,
        status: c.status,
        reach: c.reach,
        views: c.views,
        likes: c.likes,
        shares: c.shares,
        comments: c.comments
    }));

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft gap-4">
                <div>
                    <button
                        onClick={() => navigate(isInfluencer ? '/influencer' : '/evidence')}
                        className={`text-sm font-bold mb-2 flex items-center gap-1 transition-colors ${isInfluencer ? 'text-purple-400 hover:text-purple-600' : 'text-slate-400 hover:text-blue-600'}`}
                    >
                        <span className="material-icons-round text-sm">arrow_back</span>
                        {isInfluencer ? 'Voltar para Influenciadores' : 'Voltar para Registros'}
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        {isInfluencer && (
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                                <span className="material-icons-round">person</span>
                            </div>
                        )}
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{registry.title}</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                            <span className="material-icons-round text-sm">public</span>
                            {registry.country === 'BR' ? '🇧🇷' : registry.country === 'PY' ? '🇵🇾' : registry.country}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                            <span className="material-icons-round text-sm">calendar_today</span>
                            {new Date(registry.start_date).toLocaleDateString()} - {new Date(registry.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                            <span className="material-icons-round text-sm">{isInfluencer ? 'alternate_email' : 'tag'}</span>
                            {registry.keywords?.join(', ')}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <span className="material-icons-round">edit</span>
                        Editar
                    </button>
                    <button
                        onClick={() => navigate(`/presentation/${id}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30"
                    >
                        <span className="material-icons-round">slideshow</span>
                        Gerar Apresentação
                    </button>
                    <button
                        onClick={generatePDF}
                        disabled={generatingPdf}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPdf ? (
                            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-icons-round">picture_as_pdf</span>
                        )}
                        {generatingPdf ? 'Gerando...' : 'Baixar PDF'}
                    </button>
                </div>
            </div>

            {/* Hidden PDF Template */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                {data && (
                    <PDFReportTemplate
                        registry={data.registry}
                        items={data.content}
                        chartData={(() => {
                            const platformMap = data.content.reduce((acc, item) => {
                                const p = item.platform_type || 'social';
                                acc[p] = (acc[p] || 0) + (item.views || 0);
                                return acc;
                            }, {});
                            return Object.entries(platformMap).map(([name, value]) => ({ name, value }));
                        })()}
                        // Note: metric names in dashboard 'metrics' object might differ from what Template expects. 
                        // EvidenceDashboard metrics: total_posts, total_views, total_interactions, total_likes, total_comments
                        // Template expects: totalReach, totalEng, totalViews
                        // Mapping:
                        // totalReach -> metrics.total_posts (User label says "Total Encontrado", template says "Alcance Total"??)
                        // Actually in PresentationView it calculated reach from items. 
                        // Let's recalculate from content to be consistent with Template logic if metrics property names differ.

                        // Re-calculating to match PresentationView logic exactly:
                        totalReach={data.content.reduce((acc, item) => acc + (item.reach || 0), 0)}
                        totalEng={data.metrics.total_interactions}
                        totalViews={data.metrics.total_views}
                    />
                )}
            </div>


            {/* Edit Modal */}
            {
                showEditModal && (
                    <EditRegistryModal
                        registry={registry}
                        onClose={() => setShowEditModal(false)}
                        onSave={handleUpdate}
                    />
                )
            }

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <MetricCard
                    title="Total Encontrado"
                    value={metrics.total_posts}
                    icon="manage_search"
                    color="bg-blue-600"
                />
                <MetricCard
                    title="Visualizações"
                    value={metrics.total_views}
                    icon="visibility"
                    color="bg-indigo-600"
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

            {/* Content Grid */}
            <ContentGrid
                items={contentItems}
                title="Conteúdos Identificados"
                limit={100}
                showPagination={true}
            />
        </div >
    );
}
