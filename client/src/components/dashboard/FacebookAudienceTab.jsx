import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import AudienceView from './AudienceView';

const FacebookAudienceTab = () => {
    const { country } = useOutletContext();
    const [audienceData, setAudienceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAudienceData = async () => {
            setLoading(true);
            try {
                const data = await dataService.getAudienceDemographics(country, 'Facebook');
                setAudienceData(data);
            } catch (error) {
                console.error('Error loading audience data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAudienceData();
    }, [country]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <span className="material-icons-round animate-spin text-4xl text-blue-500">sync</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Facebook - Público</h1>
                {audienceData && audienceData.importDate && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                        Última importação: {new Date(audienceData.importDate).toLocaleDateString('pt-BR')}
                    </span>
                )}
            </div>

            {audienceData ? (
                <AudienceView data={audienceData} />
            ) : (
                <div className="bg-white dark:bg-card-dark p-20 rounded-[2.5rem] shadow-sm border border-gray-100 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span className="material-icons-round text-4xl">analytics</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Análise de Público em Processamento</h3>
                    <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                        No momento, as métricas demográficas para o Facebook estão sendo sincronizadas ou não foram encontradas para este filtro. 
                        Nossa equipe técnica já foi notificada para verificar a integridade da conexão.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:scale-105 transition-all">
                            Recarregar Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookAudienceTab;
