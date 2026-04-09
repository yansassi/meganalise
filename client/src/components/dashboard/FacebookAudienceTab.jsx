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
                <div className="bg-white dark:bg-card-dark p-12 rounded-3xl shadow-soft text-center text-slate-400">
                    <span className="material-icons-round text-5xl mb-4 opacity-20">group_off</span>
                    <p>Dados de público do Facebook não disponíveis para este período/país.</p>
                </div>
            )}
        </div>
    );
};

export default FacebookAudienceTab;
