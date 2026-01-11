import React, { useState, useEffect } from 'react';

const DateRangeFilter = ({ onFilterChange, className }) => {
    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Initialize with "Last 30 Days"
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return formatDate(d);
    });

    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return formatDate(d);
    });

    const [activePreset, setActivePreset] = useState('last30');

    // Notify parent whenever dates change
    useEffect(() => {
        onFilterChange({ startDate, endDate });
    }, [startDate, endDate]);

    const handlePresetChange = (preset) => {
        const end = new Date();
        const start = new Date();

        switch (preset) {
            case 'today':
                // start is today, end is today
                break;
            case 'last7':
                start.setDate(end.getDate() - 7);
                break;
            case 'last30':
                start.setDate(end.getDate() - 30);
                break;
            case 'thisMonth':
                start.setDate(1); // 1st day of current month
                break;
            case 'lastMonth':
                start.setMonth(start.getMonth() - 1);
                start.setDate(1); // 1st day of last month
                end.setDate(0); // Last day of last month (0th day of current month)
                break;
            default:
                break;
        }

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
        setActivePreset(preset);
    };

    const handleCustomDateChange = (type, value) => {
        if (type === 'start') setStartDate(value);
        if (type === 'end') setEndDate(value);
        setActivePreset('custom');
    };

    return (
        <div className={`glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 ${className}`}>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                    onClick={() => handlePresetChange('today')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === 'today' ? 'bg-white dark:bg-white/20 text-primary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Hoje
                </button>
                <button
                    onClick={() => handlePresetChange('last7')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === 'last7' ? 'bg-white dark:bg-white/20 text-primary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    7 Dias
                </button>
                <button
                    onClick={() => handlePresetChange('last30')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === 'last30' ? 'bg-white dark:bg-white/20 text-primary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    30 Dias
                </button>
                <button
                    onClick={() => handlePresetChange('thisMonth')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === 'thisMonth' ? 'bg-white dark:bg-white/20 text-primary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Este Mês
                </button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <span className="text-slate-400 font-bold">-</span>
                <div className="relative">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>
        </div>
    );
};

export default DateRangeFilter;
