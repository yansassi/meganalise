import React, { useState } from 'react';
import { instagramParser } from '../services/instagramParser';
import { dataService } from '../services/dataService';

const UploadMetrics = () => {
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('BR');
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);

    // Progress State
    const [showProgress, setShowProgress] = useState(false);
    const [progressValue, setProgressValue] = useState(0);
    const [progressAction, setProgressAction] = useState('');
    const [progressDetails, setProgressDetails] = useState('');
    const [completed, setCompleted] = useState(false);

    // Platforms Configuration
    const platforms = [
        { id: 'Instagram', label: 'Instagram', icon: 'photo_camera', color: 'bg-gradient-to-tr from-yellow-400 to-purple-600' },
        { id: 'Facebook', label: 'Facebook', icon: 'facebook', color: 'bg-blue-600' },
        { id: 'TikTok', label: 'TikTok', icon: 'music_note', color: 'bg-black' },
        { id: 'YouTube', label: 'YouTube', icon: 'smart_display', color: 'bg-red-600' },
    ];

    const handleFileUpload = async (uploadedFiles) => {
        if (!selectedPlatform) {
            alert('Por favor, selecione uma rede social primeiro.');
            return;
        }

        setFiles(Array.from(uploadedFiles));
        setShowProgress(true);
        setCompleted(false);
        setProgressAction('Processando Arquivos');
        setProgressValue(0);

        const tempParsed = [];
        const totalFiles = uploadedFiles.length;

        for (let i = 0; i < totalFiles; i++) {
            const file = uploadedFiles[i];
            setProgressDetails(`Lendo ${file.name}...`);

            try {
                await new Promise(r => setTimeout(r, 200));

                // NOTE: Currently reusing instagramParser for all platforms as requested 
                // ("escolho qual idioma é as métricas e pronto, aparece o processo de colocar os dados igual antes")
                // In the future, we might need different parsers based on selectedPlatform
                const result = await instagramParser.parseFile(file);

                // Inject selected platform if the parser doesn't provide it or to override it
                // result.data.forEach(item => item.platform = selectedPlatform); // If we need to modify data on the fly

                tempParsed.push(result);
            } catch (error) {
                console.error("Erro ao ler arquivo:", file.name, error);
            }

            setProgressValue(((i + 1) / totalFiles) * 30);
        }

        if (tempParsed.length > 0) {
            setProgressAction('Salvando no Banco de Dados');
            setProgressDetails(`Salvando dados do ${selectedPlatform} (${selectedCountry})...`);

            let totalRecords = 0;
            tempParsed.forEach(f => totalRecords += f.data.length);

            let processedCount = 0;

            for (let i = 0; i < tempParsed.length; i++) {
                const group = tempParsed[i];
                const groupSize = group.data.length;

                setProgressDetails(`Salvando lote ${i + 1}/${tempParsed.length}...`);

                // Check if we need to pass platform to save functions
                if (group.type === 'metric') {
                    await dataService.saveDailyMetrics(group.data, selectedCountry, selectedPlatform);
                } else if (group.type === 'content') {
                    // We might need to ensure the content items have the correct platform_type
                    // For now, instagramParser sets it. If we parse other files, we might need to override here.
                    await dataService.saveContentItems(group.data, selectedCountry, selectedPlatform);
                }

                processedCount += groupSize;
                setProgressValue(30 + ((processedCount / totalRecords) * 70));
            }

            setProgressDetails('Concluído!');
            setProgressValue(100);
            setCompleted(true);
        } else {
            setShowProgress(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
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

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => document.getElementById('pageFileInput').click()}
                                        className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-icons-round">folder_open</span>
                                        Escolher Arquivos
                                    </button>
                                </div>
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
