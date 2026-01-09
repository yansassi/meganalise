import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { instagramParser } from '../../services/instagramParser';
import { dataService } from '../../services/dataService';
import StatCards from './StatCards';
import GrowthChart from './GrowthChart';
import ContentTable from './ContentTable';

const ProgressModal = ({ isOpen, progress, action, details }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card-dark w-full max-w-md p-8 rounded-3xl shadow-2xl transform scale-100 transition-all">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl animate-spin">sync</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{action}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{details}</p>
                </div>

                <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-end">
                    <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
                </div>
            </div>
        </div>
    );
};

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        onUpload(e.dataTransfer.files);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-card-dark w-full max-w-2xl p-8 rounded-3xl shadow-2xl transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Importar Dados</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div
                    className={`border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300
                    ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }
                `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl">cloud_upload</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Arraste e solte arquivos CSV</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-2">
                        Carregue "Alcance.csv", "Interações.csv" ou exportações de conteúdo.
                    </p>
                    <button className="text-primary font-bold hover:underline" onClick={() => document.getElementById('modalFileInput').click()}>
                        Ou navegue pelos arquivos
                    </button>
                    <input
                        id="modalFileInput"
                        type="file"
                        multiple
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => { onUpload(e.target.files); onClose(); }}
                    />
                </div>
            </div>
        </div>
    );
};

const PlatformView = ({ platform }) => {
    const { country } = useOutletContext();
    const [data, setData] = useState({
        stats: [
            { label: 'Alcance Total', value: 0, trend: 0, icon: 'visibility', color: 'blue' },
            { label: 'Interações', value: 0, trend: 0, icon: 'favorite', color: 'purple' },
            { label: 'Seguidores', value: 0, trend: 0, icon: 'group', color: 'orange' },
        ],
        chartData: [],
        contentItems: [],
        isLoaded: false
    });
    const [isDragging, setIsDragging] = useState(false);
    const [parsedFiles, setParsedFiles] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Progress State
    const [showProgress, setShowProgress] = useState(false);
    const [progressValue, setProgressValue] = useState(0);
    const [progressAction, setProgressAction] = useState('');
    const [progressDetails, setProgressDetails] = useState('');

    useEffect(() => {
        loadFromDatabase();
    }, [country]);

    const loadFromDatabase = async () => {
        const dbData = await dataService.getDashboardData(country, platform);
        if (dbData.metrics.length > 0 || dbData.content.length > 0) {
            processDbData(dbData);
        } else {
            setData(prev => ({ ...prev, isLoaded: false }));
        }
    };

    const processDbData = (dbData) => {
        let reach = 0, interactions = 0, followers = 0, websiteClicks = 0, profileVisits = 0, storyViews = 0;
        const chartMap = {};

        dbData.metrics.forEach(m => {
            if (m.metric === 'reach') reach += m.value;
            if (m.metric === 'interactions') interactions += m.value;
            if (m.metric === 'followers') followers += m.value;
            if (m.metric === 'website_clicks') websiteClicks += m.value;
            if (m.metric === 'profile_visits') profileVisits += m.value;

            if (m.metric === 'reach') {
                chartMap[m.date] = (chartMap[m.date] || 0) + m.value;
            }
        });

        const chartData = Object.keys(chartMap).sort().map(date => ({
            name: date,
            value: chartMap[date]
        }));

        // Filter out stories for the main table if platform is Instagram

        let reels = [];
        let stories = [];

        // Calculate aggregated story views and categorize
        dbData.content.forEach(c => {
            const item = {
                id: c.original_id,
                title: c.title,
                imageUrl: c.image_url,
                platform: c.platform_type,
                manager: 'Time Social',
                date: new Date(c.date).toLocaleDateString('pt-BR'),
                virality: c.virality_score,
                status: c.status,
                reach: c.reach,
                saved: c.saved,
                views: c.views,
                duration: c.duration,
                permalink: c.permalink
            };

            if (platform === 'Instagram') {
                // Expanded check: Explicit 'story' type OR 'social' type with views (legacy/heuristic)
                if (c.platform_type === 'story' || (c.platform_type === 'social' && (c.views > 0 || c.title.startsWith('Story -')))) {
                    storyViews += (c.views || 0);
                    stories.push(item);
                } else {
                    reels.push(item);
                }
            }
        });

        // Current general contentItems (only non-stories if logic above persists, but we are replacing usage)
        const contentItems = dbData.content.map(c => ({
            id: c.original_id,
            title: c.title,
            imageUrl: c.image_url,
            platform: c.platform_type,
            manager: 'Time Social',
            date: new Date(c.date).toLocaleDateString('pt-BR'),
            virality: c.virality_score,
            status: c.status,
            reach: c.reach,
            saved: c.saved,
            views: c.views,
            duration: c.duration,
            permalink: c.permalink
        }));

        const stats = [
            { label: 'Alcance Total', value: reach, trend: 0, icon: 'visibility', color: 'blue' },
            { label: 'Interações', value: interactions, trend: 0, icon: 'favorite', color: 'purple' },
            { label: 'Seguidores', value: followers, trend: 0, icon: 'group', color: 'orange' },
            { label: 'Visitas ao Perfil', value: profileVisits, trend: 0, icon: 'person_search', color: 'teal' },
            { label: 'Cliques no Link', value: websiteClicks, trend: 0, icon: 'link', color: 'green' }
        ];

        if (platform === 'Instagram') {
            stats.push({ label: 'Views em Stories', value: storyViews, trend: 0, icon: 'amp_stories', color: 'pink' });
        }

        setData({
            stats,
            chartData,
            contentItems, // kept for other platforms
            reels,   // New
            stories, // New
            isLoaded: true
        });
    };

    const handleFileUpload = async (files) => {
        setShowProgress(true);
        setProgressAction('Processando Arquivos');
        setProgressValue(0);

        const tempParsed = [];
        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            setProgressDetails(`Lendo ${file.name}...`);

            try {
                // Simulate small delay for UX
                await new Promise(r => setTimeout(r, 200));

                const result = await instagramParser.parseFile(file);
                tempParsed.push(result);
            } catch (error) {
                console.error("Erro ao ler arquivo:", file.name, error);
            }

            setProgressValue(((i + 1) / totalFiles) * 30); // First 30% is parsing
        }

        if (tempParsed.length > 0) {
            // Auto-save logic
            setProgressAction('Salvando no Banco de Dados');
            setProgressDetails('Conectando ao PocketBase...');

            let totalRecords = 0;
            tempParsed.forEach(f => totalRecords += f.data.length);

            let processedCount = 0;
            let totalSaved = 0;

            for (let i = 0; i < tempParsed.length; i++) {
                const group = tempParsed[i];
                const groupSize = group.data.length;

                setProgressDetails(`Salvando lote ${i + 1}/${tempParsed.length}...`);

                if (group.type === 'metric') {
                    const res = await dataService.saveDailyMetrics(group.data, country);
                    totalSaved += res.savedCount;
                } else if (group.type === 'content') {
                    const res = await dataService.saveContentItems(group.data, country);
                    totalSaved += res.savedCount;
                }

                processedCount += groupSize;
                // Progress from 30% to 100%
                setProgressValue(30 + ((processedCount / totalRecords) * 70));
            }

            await loadFromDatabase();

            setProgressDetails('Concluído!');
            await new Promise(r => setTimeout(r, 500));
        }

        setShowProgress(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <ProgressModal
                isOpen={showProgress}
                progress={progressValue}
                action={progressAction}
                details={progressDetails}
            />

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleFileUpload}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{platform} - Dados</h1>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
                        {country}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 text-gray-700 dark:text-white text-sm font-bold rounded-xl shadow-soft hover:bg-gray-50 dark:hover:bg-white/20 transition-all border border-gray-100 dark:border-white/5"
                    >
                        <span className="material-icons-round text-lg">upload_file</span>
                        Importar Dados
                    </button>
                </div>
            </div>

            {/* Drag & Drop Zone (Initial State Only) */}
            {(!data.isLoaded) && (
                <div
                    className={`border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300
                    ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }
                `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl">cloud_upload</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Arraste e solte arquivos CSV</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-2">
                        Carregue "Alcance.csv", "Interações.csv" ou exportações de conteúdo.
                    </p>
                    <button className="text-primary font-bold hover:underline" onClick={() => document.getElementById('fileInput').click()}>
                        Ou navegue pelos arquivos
                    </button>
                    <input
                        id="fileInput"
                        type="file"
                        multiple
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                    />
                </div>
            )}

            {(data.isLoaded) && (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-8">
                        <StatCards stats={data.stats} />
                        {data.chartData.length > 0 && <GrowthChart data={data.chartData} />}

                        {platform === 'Instagram' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <ContentTable items={data.reels || []} title="Reels e Feed" limit={10} />
                                <ContentTable items={data.stories || []} title="Stories Recentes" limit={10} />
                            </div>
                        ) : (
                            <ContentTable items={data.contentItems} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformView;
