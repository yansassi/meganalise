import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { dataService } from '../../services/dataService';
import { pdf } from '@react-pdf/renderer';
import VectorPDFTemplate from './VectorPDFTemplate';

// --- Utility Components ---
const StatCounter = ({ label, value, color }) => (
    <div className="flex flex-col items-center">
        <motion.span
            className={`text-5xl font-black text-${color}-500`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
        >
            {value.toLocaleString('pt-BR')}
        </motion.span>
        <span className="text-sm uppercase tracking-widest text-gray-400 mt-2 font-bold">{label}</span>
    </div>
);

const MockupPhone = ({ src, type }) => (
    <motion.div
        className="relative w-[280px] h-[580px] bg-black rounded-[40px] border-[8px] border-gray-900 shadow-2xl overflow-hidden"
        initial={{ rotateY: 15, rotateX: 5, opacity: 0 }}
        whileInView={{ rotateY: 0, rotateX: 0, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
        viewport={{ once: true, margin: "-100px" }}
    >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10"></div>
        <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
            {src ? (
                <img src={src} alt="Content" className="w-full h-full object-cover opacity-90" />
            ) : (
                <div className="text-gray-600 font-bold">Sem Imagem</div>
            )}
            <div className="absolute top-10 left-4 z-20">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase backdrop-blur-md bg-black/50`}>
                    {type || 'Social'}
                </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
        </div>
    </motion.div>
);

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

const DetailModal = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#1E293B] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                    <span className="material-icons-round">close</span>
                </button>

                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4">
                    <img
                        src={dataService.getContentImageUrl(item)}
                        alt="Content"
                        className="max-h-[80vh] max-w-full object-contain rounded-xl"
                    />
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                            ${item.platform === 'instagram' ? 'bg-pink-600' :
                                item.platform === 'tiktok' ? 'bg-black border border-white/20' :
                                    item.platform === 'facebook' ? 'bg-blue-600' : 'bg-gray-600'}
                        `}>
                            <span className="material-icons-round text-white text-xl">
                                {item.platform === 'instagram' ? 'camera_alt' :
                                    item.platform === 'tiktok' ? 'music_note' :
                                        item.platform === 'facebook' ? 'facebook' : 'public'}
                            </span>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{item.platform}</p>
                            <p className="text-white font-bold text-sm">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-4 leading-relaxed">
                        "{item.title || item.caption}"
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Alcance</p>
                            <p className="text-2xl font-black text-blue-400">{item.reach?.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Engajamento</p>
                            <p className="text-2xl font-black text-purple-400">
                                {((item.likes || 0) + (item.comments || 0) + (item.shares || 0)).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                            <span className="text-gray-400 text-sm">Visualizações</span>
                            <span className="text-white font-bold">{item.views?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                            <span className="text-gray-400 text-sm">Curtidas</span>
                            <span className="text-white font-bold">{item.likes?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                            <span className="text-gray-400 text-sm">Comentários</span>
                            <span className="text-white font-bold">{item.comments?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                            <span className="text-gray-400 text-sm">Compartilhamentos</span>
                            <span className="text-white font-bold">{item.shares?.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <a
                            href={item.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Ver Post Original
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const PresentationView = () => {
    const { id } = useParams();
    const [registry, setRegistry] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { scrollYProgress } = useScroll();
    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { content, registry: loadedRegistry } = await dataService.getEvidenceDashboardData(id);
                setRegistry(loadedRegistry);
                setItems(content);
            } catch (err) {
                console.error("Error loading presentation:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const processedData = useMemo(() => {
        if (!items.length) return { topItems: [], galleryItems: [], chartData: [] };

        const sorted = [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
        const topItems = sorted.slice(0, 5);
        const galleryItems = sorted.slice(5);

        // Chart Data: Views by Platform
        const platformMap = sorted.reduce((acc, item) => {
            const p = item.platform || 'Outros';
            acc[p] = (acc[p] || 0) + (item.views || 0);
            return acc;
        }, {});

        const chartData = Object.entries(platformMap).map(([name, value]) => ({ name, value }));

        return { topItems, galleryItems, chartData };
    }, [items]);

    const generatePDF = async () => {
        setGeneratingPdf(true);
        try {
            const platformMap = items.reduce((acc, item) => {
                const p = item.platform || 'Outros';
                acc[p] = (acc[p] || 0) + (item.views || 0);
                return acc;
            }, {});
            const chartData = Object.entries(platformMap).map(([name, value]) => ({ name, value }));
            const totalReach = items.reduce((acc, item) => acc + (item.reach || 0), 0);
            const totalEng = items.reduce((acc, item) => acc + (item.likes || 0) + (item.comments || 0) + (item.shares || 0), 0);
            const totalViews = items.reduce((acc, item) => acc + (item.views || 0), 0);

            const blob = await pdf(
                <VectorPDFTemplate
                    registry={registry}
                    items={items}
                    chartData={chartData}
                    totalReach={totalReach}
                    totalEng={totalEng}
                    totalViews={totalViews}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Relatorio-${registry?.brand_name?.replace(/[^a-z0-9]/gi, '_') || 'Campanha'}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF Generation Error", err);
            alert("Erro ao gerar PDF em formato vetor. Tente novamente.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) return (
        <div className="w-full h-screen flex items-center justify-center bg-[#0F172A] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400 font-bold tracking-widest animate-pulse">GERANDO APRESENTAÇÃO...</p>
            </div>
        </div>
    );

    if (!registry) return <div className="text-white text-center mt-20">Apresentação não encontrada.</div>;

    const { topItems, galleryItems, chartData } = processedData;
    const totalReach = items.reduce((acc, item) => acc + (item.reach || 0), 0);
    const totalEng = items.reduce((acc, item) => acc + (item.likes || 0) + (item.comments || 0) + (item.shares || 0), 0);
    const totalViews = items.reduce((acc, item) => acc + (item.views || 0), 0);

    const truncate = (str, n) => str?.length > n ? str.substr(0, n - 1) + "..." : str;

    return (
        <div className="min-h-screen bg-[#0F172A] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Background */}
            <motion.div style={{ y: bgY }} className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-[#0F172A] to-[#0F172A]"></div>
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-40"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600 rounded-full blur-[128px] opacity-40"></div>
            </motion.div>

            {/* Intro */}
            <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
                    <span className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-bold tracking-widest uppercase mb-6 inline-block">Relatório de Performance</span>
                    <h1 className="text-5xl md:text-8xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">{registry.brand_name}</h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">Campanha <span className="text-white font-semibold">{registry.product_name}</span></p>
                    <div className="mt-8 flex gap-4 justify-center text-sm text-gray-500 font-mono">
                        <span>{new Date(registry.start_date).toLocaleDateString()}</span><span>—</span><span>{new Date(registry.end_date).toLocaleDateString()}</span>
                    </div>
                </motion.div>
                <motion.div className="absolute bottom-10 animate-bounce" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    <span className="material-icons-round text-4xl text-gray-600">keyboard_arrow_down</span>
                </motion.div>
            </section>

            {/* Big Numbers */}
            <section className="relative z-10 py-16 md:py-24 bg-[#0F172A]/80 backdrop-blur-sm border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                        <StatCounter label="Alcance Total" value={totalReach} color="blue" />
                        <StatCounter label="Engajamento Total" value={totalEng} color="purple" />
                        <StatCounter label="Visualizações Totais" value={totalViews} color="green" />
                    </div>
                </div>
            </section>

            {/* Highlights (Top 5) */}
            <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Top 5 Destaques</h2>
                    <p className="text-gray-400">Os conteúdos com maior performance.</p>
                </div>
                <div className="space-y-32">
                    {topItems.map((item, index) => (
                        <div key={item.id} className={`flex flex-col md:flex-row items-center gap-10 md:gap-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                            <div className="flex-1 flex justify-center perspective-1000 w-full md:w-auto">
                                <MockupPhone src={dataService.getContentImageUrl(item)} type={item.platform} />
                            </div>
                            <motion.div
                                className="flex-1 space-y-6 w-full text-center md:text-left"
                                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ margin: "-100px" }}
                            >
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <span className="material-icons-round text-white">person</span>
                                    </div>
                                    <span className="font-bold text-lg">{item.influencer_name || 'Influenciador'}</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold leading-tight text-white/90">"{truncate(item.title || item.caption, 100)}"</h3>
                                <p className="text-gray-400 text-sm">{new Date(item.date).toLocaleDateString()} • {item.platform}</p>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                        <p className="text-xs text-blue-400 uppercase font-bold mb-1">Visualizações</p>
                                        <p className="text-2xl font-black text-white">{item.views?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                        <p className="text-xs text-purple-400 uppercase font-bold mb-1">Engajamento</p>
                                        <p className="text-2xl font-black text-white">{(item.likes + item.comments + item.shares)?.toLocaleString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(item)}
                                    className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/25 mt-4"
                                >
                                    Ver Detalhes <span className="material-icons-round text-sm">visibility</span>
                                </button>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Performance Charts */}
            <section className="relative z-10 py-16 md:py-24 bg-[#0F172A]/50 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Análise de Distribuição</h2>
                        <p className="text-gray-400">Visualizações por plataforma.</p>
                    </div>
                    <div className="h-[300px] md:h-[400px] w-full max-w-2xl mx-auto bg-white/5 rounded-3xl p-6 border border-white/5">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Gallery (Remaining Items) */}
            {galleryItems.length > 0 && (
                <section className="relative z-10 py-20 px-4 md:px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Galeria da Campanha</h2>
                        <p className="text-gray-400">Mais momentos que marcaram presença.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {galleryItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                className="group relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer shadow-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index % 4 * 0.1, duration: 0.5 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                onClick={() => setSelectedItem(item)}
                            >
                                <img
                                    src={dataService.getContentImageUrl(item)}
                                    alt="Gallery Item"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-blue-500`}>
                                            {item.platform}
                                        </span>
                                    </div>
                                    <p className="text-white text-xs font-medium line-clamp-2">{item.title || item.caption}</p>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-300 font-bold">
                                        <span className="flex items-center gap-1"><span className="material-icons-round text-[10px]">visibility</span> {item.views?.toLocaleString()}</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-white/20 text-center">
                                        <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Ver Detalhes</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="relative z-10 py-20 text-center border-t border-white/5 bg-black/20">
                <p className="text-gray-500 text-sm mb-4">Gerado por Meganalise</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 px-4">
                    <button
                        onClick={generatePDF}
                        disabled={generatingPdf}
                        className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPdf ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Gerando PDF...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round text-sm">picture_as_pdf</span>
                                Baixar Relatório PDF
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copiado!');
                        }}
                        className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-sm">share</span>
                        Compartilhar Link
                     </button>
                </div>
            </footer>
            {/* Detail Modal */}
            {selectedItem && (
                <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
};

export default PresentationView;
