import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'; // Removed unused imports
import { dataService } from '../../services/dataService';

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

const MockupPhone = ({ src, type }) => {
    return (
        <motion.div
            className="relative w-[300px] h-[600px] bg-black rounded-[40px] border-[8px] border-gray-900 shadow-2xl overflow-hidden"
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

                {/* Platform Badge */}
                <div className="absolute top-10 left-4 z-20">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase backdrop-blur-md bg-black/50`}>
                        {type || 'Social'}
                    </span>
                </div>

                {/* Reflection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
            </div>
        </motion.div>
    );
};

const PresentationView = () => {
    const { id } = useParams();
    const [registry, setRegistry] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { scrollYProgress } = useScroll();

    // Parallax background effect
    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch registry details (we might need a specific method for this if not public, 
                // but assumption is we can re-use existing Evidence logic if auth is handled or we make a public route later)
                // For now, assuming user is logged in like other views.

                // We need to fetch ALL items for this registry first. 
                // dataService.getEvidenceItems filters by registry_id locally if we pass it? 
                // No, existing getEvidenceItems takes filters. 
                // Let's implement a direct fetch by key or emulate it.
                // Or better, fetch all and filter.

                const allItems = await dataService.getEvidenceItems({ registryId: id });
                // We also need registry metadata (brand name, etc). 
                // Let's assume we can fetch it via getEvidenceRegistries and finding it.
                const registries = await dataService.getEvidenceRegistries();
                const currentReg = registries.find(r => r.id === id);

                setRegistry(currentReg);
                setItems(allItems);
            } catch (err) {
                console.error("Error loading presentation:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-[#0F172A] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-400 font-bold tracking-widest animate-pulse">GERANDO APRESENTAÇÃO...</p>
                </div>
            </div>
        );
    }

    if (!registry) {
        return <div className="text-white text-center mt-20">Apresentação não encontrada.</div>;
    }

    // Aggregations
    const totalReach = items.reduce((acc, item) => acc + (item.reach || 0), 0);
    const totalEng = items.reduce((acc, item) => acc + (item.likes || 0) + (item.comments || 0) + (item.shares || 0), 0);
    const totalViews = items.reduce((acc, item) => acc + (item.views || 0), 0);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Background Elements */}
            <motion.div style={{ y: bgY }} className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-[#0F172A] to-[#0F172A]"></div>
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-40"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600 rounded-full blur-[128px] opacity-40"></div>
            </motion.div>

            {/* Header / Intro Section */}
            <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <span className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-bold tracking-widest uppercase mb-6 inline-block">
                        Relatório de Performance
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                        {registry.brand_name}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Campanha <span className="text-white font-semibold">{registry.product_name}</span>
                    </p>
                    <div className="mt-8 flex gap-4 justify-center text-sm text-gray-500 font-mono">
                        <span>{new Date(registry.start_date).toLocaleDateString()}</span>
                        <span>—</span>
                        <span>{new Date(registry.end_date).toLocaleDateString()}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="absolute bottom-10 animate-bounce"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                >
                    <span className="material-icons-round text-4xl text-gray-600">keyboard_arrow_down</span>
                </motion.div>
            </section>

            {/* Big Numbers Section */}
            <section className="relative z-10 py-32 bg-[#0F172A]/80 backdrop-blur-sm border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                        <StatCounter label="Alcance Total" value={totalReach} color="blue" />
                        <StatCounter label="Engajamento" value={totalEng} color="purple" />
                        <StatCounter label="Visualizações" value={totalViews} color="green" />
                    </div>
                </div>
            </section>

            {/* Content Gallery (Scrollytelling) */}
            <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-4xl font-bold mb-4">Destaques da Campanha</h2>
                    <p className="text-gray-400">Os conteúdos que moveram a audiência.</p>
                </div>

                <div className="space-y-48">
                    {items.map((item, index) => (
                        <div key={item.id} className={`flex flex-col md:flex-row items-center gap-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                            {/* Mockup Side */}
                            <div className="flex-1 flex justify-center perspective-1000">
                                <MockupPhone src={item.image_url} type={item.platform} />
                            </div>

                            {/* Info Side */}
                            <motion.div
                                className="flex-1 space-y-8"
                                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ margin: "-100px" }}
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                            <span className="material-icons-round text-white">person</span>
                                        </div>
                                        <span className="font-bold text-lg">{item.influencer_name || 'Influenzer'}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold leading-tight mb-2">"{item.title || item.caption?.slice(0, 50) + '...'}"</h3>
                                    <p className="text-gray-400 text-sm">{new Date(item.date).toLocaleDateString()} • {item.platform}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Alcance</p>
                                        <p className="text-xl font-bold text-white">{item.reach?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Curtidas</p>
                                        <p className="text-xl font-bold text-white">{item.likes?.toLocaleString()}</p>
                                    </div>
                                </div>
                                <a
                                    href={item.permalink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-bold text-sm"
                                >
                                    Ver original <span className="material-icons-round text-sm">open_in_new</span>
                                </a>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 text-center border-t border-white/5 bg-black/20">
                <p className="text-gray-500 text-sm mb-4">Gerado por Meganalise</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copiado!');
                        }}
                        className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                    >
                        Compartilhar Link
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default PresentationView;
