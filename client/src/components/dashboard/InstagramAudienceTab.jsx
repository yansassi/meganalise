import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import AudienceView from './AudienceView';

const InstagramAudienceTab = () => {
    const { country } = useOutletContext();
    const [audienceData, setAudienceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAudienceData = async () => {
            setLoading(true);
            try {
                const data = await dataService.getAudienceDemographics(country);
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
            <div className="flex items-center justify-center p-12">
                <span className="material-icons-round animate-spin text-3xl text-gray-400">sync</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold">Instagram - Público</h1>
                {audienceData && audienceData.importDate && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
                        Última importação: {new Date(audienceData.importDate).toLocaleDateString('pt-BR')}
                    </span>
                )}
            </div>

            <AudienceView data={audienceData} />
        </div>
    );
};

export default InstagramAudienceTab;
