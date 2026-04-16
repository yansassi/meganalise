import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AudienceView from './AudienceView';
import { dataService } from '../../services/dataService';
import { useState, useEffect } from 'react';

const YouTubeAudienceTab = () => {
    const { country } = useOutletContext();
    const [audienceData, setAudienceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await dataService.getAudienceDemographics(country, 'YouTube');
            setAudienceData(data);
            setLoading(false);
        };
        load();
    }, [country]);

    if (loading) return (
        <div className="p-8 text-center text-gray-500">
            <span className="material-icons-round text-4xl animate-spin mb-2 block">sync</span>
            Carregando dados de audiência...
        </div>
    );

    if (!audienceData) return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <span className="material-icons-round text-6xl opacity-20">people</span>
            <p className="text-sm font-medium">Nenhum dado de audiência disponível para YouTube.</p>
            <p className="text-xs opacity-70">Importe os arquivos de audiência do YouTube Studio.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <span className="material-icons-round text-red-500 text-xl">people</span>
                </div>
                <h1 className="text-2xl font-bold">YouTube - Público</h1>
            </div>
            <AudienceView data={audienceData} />
        </div>
    );
};

export default YouTubeAudienceTab;
