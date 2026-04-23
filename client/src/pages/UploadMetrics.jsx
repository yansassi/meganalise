import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { pb } from '../lib/pocketbase';

const UploadMetrics = () => {
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('BR');
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);

    // Progress State (CSV upload)
    const [showProgress, setShowProgress] = useState(false);
    const [progressValue, setProgressValue] = useState(0);
    const [progressAction, setProgressAction] = useState('');
    const [progressDetails, setProgressDetails] = useState('');
    const [completed, setCompleted] = useState(false);

    // Facebook API Sync State
    const [showSyncPanel, setShowSyncPanel] = useState(false);
    const [syncPreset, setSyncPreset] = useState('30');
    const [syncSince, setSyncSince] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [syncUntil, setSyncUntil] = useState(() => new Date().toISOString().split('T')[0]);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [syncError, setSyncError] = useState('');

    // Platforms Configuration
    const platforms = [
        { id: 'Instagram', label: 'Instagram', icon: 'photo_camera', color: 'bg-gradient-to-tr from-yellow-400 to-purple-600' },
        { id: 'Facebook', label: 'Facebook', icon: 'facebook', color: 'bg-blue-600' },
        { id: 'TikTok', label: 'TikTok', icon: 'music_note', color: 'bg-black' },
        { id: 'YouTube', label: 'YouTube', icon: 'smart_display', color: 'bg-red-600' },
    ];

    // Platform-specific upload instructions
    const platformInstructions = {
        Instagram: {
            title: 'Arquivos do Instagram',
            description: 'Exporte do Instagram Insights ou Meta Business Suite.',
            files: ['Alcance.csv', 'Interações.csv', 'Seguidores.csv', 'Público.csv', 'Conteúdo publicado.csv'],
            color: 'from-yellow-400 to-purple-600',
            bg: 'bg-purple-50',
            text: 'text-purple-600'
        },
        Facebook: {
            title: 'Arquivos do Facebook',
            description: 'Exporte do Facebook Insights ou Meta Business Suite.',
            files: ['Visualizações.csv', 'Seguidores.csv', 'Interações.csv', 'Visitas.csv', 'Publicações.csv'],
            color: 'from-blue-500 to-blue-700',
            bg: 'bg-blue-50',
            text: 'text-blue-600'
        },
        TikTok: {
            title: 'Arquivos do TikTok',
            description: 'Exporte do TikTok Studio em Análise > Exportar.',
            files: ['Overview.csv', 'Content.csv', 'Followers.csv', 'FollowerGender.csv', 'FollowerTopTerritories.csv'],
            color: 'from-gray-700 to-black',
            bg: 'bg-gray-50',
            text: 'text-gray-700'
        },
        YouTube: {
            title: 'Arquivos do YouTube Studio',
            description: 'Acesse YouTube Studio > Análises > Exportar e envie os CSVs das pastas abaixo:',
            files: [
                '📊 Conteúdo → Dados da tabela.csv (lista de vídeos)',
                '📈 Conteúdo → Dados do gráfico.csv (visualizações por dia)',
                '👥 Espectadores novos e recorrentes → Dados do gráfico.csv',
                '🌍 País → Dados do gráfico.csv',
                '🔀 Origem do tráfego → Dados do gráfico.csv',
            ],
            color: 'from-red-500 to-red-700',
            bg: 'bg-red-50',
            text: 'text-red-600'
        }
    };

    const currentInstructions = selectedPlatform ? platformInstructions[selectedPlatform] : null;

    const handleFileUpload = async (uploadedFiles) => {
        if (!selectedPlatform) {
            alert('Por favor, selecione uma rede social primeiro.');
            return;
        }

        setFiles(Array.from(uploadedFiles));
        setShowProgress(true);
        setCompleted(false);
        setProgressAction('Enviando para Análise');
        setProgressValue(0);

        const totalFiles = uploadedFiles.length;
        let processedCount = 0;

        for (let i = 0; i < totalFiles; i++) {
            const file = uploadedFiles[i];
            setProgressAction('Processando Arquivo');
            setProgressDetails(`Enviando ${file.name} para o servidor...`);

            try {
                // Call API directly - Backend parses and saves
                const result = await dataService.uploadMetrics(file, selectedCountry, selectedPlatform);

                console.log('Upload Result:', result);

                // Update progress based on success
                processedCount++;
                const newProgress = (processedCount / totalFiles) * 100;
                setProgressValue(newProgress);

            } catch (error) {
                console.error("Erro no upload:", file.name, error);
                alert(`Erro ao processar ${file.name}: ${error.message}`);
            }
        }

        setProgressDetails('Concluído!');
        setProgressValue(100);
        setCompleted(true);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    // ── Facebook API Sync ──────────────────────────────────────────
    const countrySlug = selectedCountry === 'BR' ? 'brasil' : 'paraguai';

    const applyPreset = (days) => {
        setSyncPreset(days);
        const d = new Date();
        d.setDate(d.getDate() - parseInt(days));
        setSyncSince(d.toISOString().split('T')[0]);
        setSyncUntil(new Date().toISOString().split('T')[0]);
    };

    const handleSyncFacebook = async () => {
        setSyncLoading(true);
        setSyncResult(null);
        setSyncError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.meganalise.pro';
            const response = await fetch(`${apiUrl}/api/facebook/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({ country: countrySlug, since: syncSince, until: syncUntil })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Erro ao sincronizar');
            }

            setSyncResult(data.summary);
        } catch (err) {
            setSyncError(err.message);
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Enviar Métricas</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Selecione a plataforma e carregue seus relatórios.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Selection */}
                <div className="lg:col-span-1 space-y-8">

                    {/* 1. Platform Selection */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
                            Escolha a Rede Social
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {platforms.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPlatform(p.id)}
                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${selectedPlatform === p.id
                                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                        : 'border-transparent bg-white dark:bg-card-dark hover:border-gray-200 dark:hover:border-white/10 shadow-soft'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                                        <span className="material-icons-round text-xl">{p.icon}</span>
                                    </div>
                                    <span className={`block font-bold ${selectedPlatform === p.id ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {p.label}
                                    </span>
                                    {selectedPlatform === p.id && (
                                        <span className="absolute top-3 right-3 text-primary material-icons-round text-lg animate-fade-in">check_circle</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. Country Selection */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</span>
                            Defina o Público/País
                        </h3>
                        <div className="bg-white dark:bg-card-dark p-1.5 rounded-2xl flex shadow-soft border border-gray-100 dark:border-white/5">
                            <button
                                onClick={() => setSelectedCountry('BR')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${selectedCountry === 'BR' ? 'bg-indigo-100 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <img src="https://flagcdn.com/w40/br.png" alt="BR" className="w-5 h-auto rounded-sm" />
                                Brasil
                            </button>
                            <div className="w-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                            <button
                                onClick={() => setSelectedCountry('PY')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${selectedCountry === 'PY' ? 'bg-indigo-100 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <img src="https://flagcdn.com/w40/py.png" alt="PY" className="w-5 h-auto rounded-sm" />
                                Paraguai
                            </button>
                        </div>
                    </section>

                    {/* 3. Platform Instructions */}
                    {currentInstructions && (
                        <section className={`${currentInstructions.bg} border border-gray-100 dark:bg-opacity-20 rounded-2xl p-5`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`material-icons-round text-base ${currentInstructions.text}`}>info</span>
                                <h4 className={`font-bold text-sm ${currentInstructions.text}`}>{currentInstructions.title}</h4>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{currentInstructions.description}</p>
                            <ul className="space-y-1.5">
                                {currentInstructions.files.map((file, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                        <span className="material-icons-round text-gray-400 text-xs mt-0.5">check_circle</span>
                                        <span>{file}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                </div>

                {/* Right Column: Upload Area */}
                <div className="lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</span>
                        Faça o Upload
                    </h3>

                    <div
                        className={`h-[400px] border-3 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 relative
                ${isDragging
                                ? 'border-primary bg-primary/5 scale-[1.01]'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark hover:border-primary/50'
                            }
                ${!selectedPlatform ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            `}
                        onDragOver={(e) => { e.preventDefault(); if (selectedPlatform) setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={selectedPlatform ? onDrop : (e) => e.preventDefault()}
                    >
                        {!selectedPlatform ? (
                            <div className="max-w-xs mx-auto animate-pulse">
                                <span className="material-icons-round text-6xl text-gray-300 mb-4">lock</span>
                                <h3 className="text-xl font-bold text-gray-400">Selecione uma rede social</h3>
                                <p className="text-gray-400 mt-2">Escolha a plataforma no passo 1 para liberar o upload.</p>
                            </div>
                        ) : showProgress ? (
                            <div className="w-full max-w-md p-8 animate-fade-in">
                                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                    {completed ? (
                                        <span className="material-icons-round text-4xl text-green-500 animate-bounce-in">check_circle</span>
                                    ) : (
                                        <span className="material-icons-round text-4xl animate-spin">sync</span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{completed ? 'Sucesso!' : progressAction}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">{progressDetails}</p>

                                <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${completed ? 'bg-green-500' : 'bg-primary'}`}
                                        style={{ width: `${progressValue}%` }}
                                    ></div>
                                </div>

                                {completed && (
                                    <button
                                        onClick={() => { setShowProgress(false); setFiles([]); }}
                                        className="px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl font-bold transition-colors"
                                    >
                                        Enviar Mais Arquivos
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                                    <span className="material-icons-round text-4xl">cloud_upload</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Arraste seus arquivos CSV</h3>
                                <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                                    Você está enviando dados para <strong className="text-primary">{selectedPlatform}</strong> em <strong className="text-indigo-500">{selectedCountry === 'BR' ? 'Brasil' : 'Paraguai'}</strong>.
                                </p>

                                <div className="flex gap-4 flex-wrap justify-center">
                                    <button
                                        onClick={() => document.getElementById('pageFileInput').click()}
                                        className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-icons-round">folder_open</span>
                                        Escolher Arquivos
                                    </button>

                                    {/* Botão API — somente para Facebook */}
                                    {selectedPlatform === 'Facebook' && (
                                        <button
                                            onClick={() => { setShowSyncPanel(p => !p); setSyncResult(null); setSyncError(''); }}
                                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-icons-round">sync</span>
                                            Sincronizar via API
                                        </button>
                                    )}
                                </div>

                                {/* Painel de Sync da API — Facebook */}
                                {selectedPlatform === 'Facebook' && showSyncPanel && (
                                    <div className="mt-6 w-full max-w-md mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5 text-left animate-fade-in">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-icons-round text-blue-600 text-lg">api</span>
                                            <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Meta Graph API</h4>
                                            <span className="ml-auto text-xs text-gray-400">{selectedCountry === 'BR' ? '🇧🇷 Brasil' : '🇵🇾 Paraguai'}</span>
                                        </div>

                                        {/* Presets de período */}
                                        <p className="text-xs text-gray-500 mb-2 font-semibold">Período a sincronizar</p>
                                        <div className="flex gap-2 mb-4 flex-wrap">
                                            {['7', '30', '90'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => applyPreset(d)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        syncPreset === d
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-blue-100'
                                                    }`}
                                                >
                                                    Últimos {d} dias
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setSyncPreset('custom')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    syncPreset === 'custom'
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-blue-100'
                                                }`}
                                            >
                                                Personalizado
                                            </button>
                                        </div>

                                        {/* Datas customizadas */}
                                        {syncPreset === 'custom' && (
                                            <div className="flex gap-3 mb-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 block mb-1">De</label>
                                                    <input
                                                        type="date"
                                                        value={syncSince}
                                                        onChange={e => setSyncSince(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark text-sm focus:outline-none focus:border-blue-400"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 block mb-1">Até</label>
                                                    <input
                                                        type="date"
                                                        value={syncUntil}
                                                        onChange={e => setSyncUntil(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark text-sm focus:outline-none focus:border-blue-400"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Período selecionado */}
                                        {syncPreset !== 'custom' && (
                                            <p className="text-xs text-gray-400 mb-4">
                                                <span className="font-semibold text-blue-600">{syncSince}</span> até <span className="font-semibold text-blue-600">{syncUntil}</span>
                                            </p>
                                        )}

                                        {/* Botão de Sincronizar */}
                                        <button
                                            onClick={handleSyncFacebook}
                                            disabled={syncLoading}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                                        >
                                            {syncLoading ? (
                                                <><span className="material-icons-round animate-spin text-lg">sync</span> Sincronizando...</>
                                            ) : (
                                                <><span className="material-icons-round text-lg">cloud_sync</span> Iniciar Sync</>  
                                            )}
                                        </button>

                                        {/* Resultado */}
                                        {syncResult && (
                                            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl p-4 animate-fade-in">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="material-icons-round text-green-500">check_circle</span>
                                                    <span className="font-bold text-green-700 dark:text-green-400 text-sm">Sincronização concluída!</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { label: 'Métricas', icon: 'bar_chart', val: syncResult.metrics?.saved ?? 0 },
                                                        { label: 'Posts', icon: 'article', val: syncResult.posts?.saved ?? 0 },
                                                        { label: 'Stories', icon: 'auto_stories', val: syncResult.stories?.saved ?? 0 },
                                                    ].map(item => (
                                                        <div key={item.label} className="text-center bg-white dark:bg-white/5 rounded-lg p-2">
                                                            <span className="material-icons-round text-blue-500 text-base">{item.icon}</span>
                                                            <p className="font-bold text-lg text-gray-800 dark:text-white leading-none mt-1">{item.val}</p>
                                                            <p className="text-xs text-gray-400">{item.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Erro */}
                                        {syncError && (
                                            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
                                                <span className="material-icons-round text-red-500 text-base mt-0.5">error</span>
                                                <p className="text-xs text-red-600 dark:text-red-400">{syncError}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <input
                                    id="pageFileInput"
                                    type="file"
                                    multiple
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadMetrics;
