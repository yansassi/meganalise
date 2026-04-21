import React, { useState, useEffect } from 'react';

const DateRangeFilter = ({ onFilterChange, className, initialRange }) => {
    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => {
        const d = date ? new Date(date) : new Date();
        if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-CA');
        
        // Use local date parts to avoid UTC shift
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    // Initialize with provided range or "Last 30 Days"
    const [startDate, setStartDate] = useState(() => {
        if (initialRange?.startDate) return formatDate(initialRange.startDate);

        const d = new Date();
        d.setDate(d.getDate() - 30);
        return formatDate(d);
    });

    const [endDate, setEndDate] = useState(() => {
        if (initialRange?.endDate) return formatDate(initialRange.endDate);

        const d = new Date();
        return formatDate(d);
    });

    // Determine initial preset if straightforward, else 'custom'
    const [activePreset, setActivePreset] = useState(() => {
        if (initialRange?.preset) return initialRange.preset;
        return 'custom';
    });

    // Sync with initialRange if it changes externally
    useEffect(() => {
        if (initialRange) {
            const newStart = initialRange.startDate ? formatDate(initialRange.startDate) : startDate;
            const newEnd = initialRange.endDate ? formatDate(initialRange.endDate) : endDate;
            const newPreset = initialRange.preset || activePreset;

            if (newStart !== startDate) setStartDate(newStart);
            if (newEnd !== endDate) setEndDate(newEnd);
            if (newPreset !== activePreset) setActivePreset(newPreset);
        }
    }, [initialRange]);


    // Notify parent whenever dates change — also sends the active preset
    useEffect(() => {
        onFilterChange({ startDate, endDate, preset: activePreset });
    }, [startDate, endDate, activePreset]);

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
            case 'last60':
                start.setDate(end.getDate() - 60);
                break;
            case 'last90':
                start.setDate(end.getDate() - 90);
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

    const presets = [
        { id: 'today', label: 'Hoje' },
        { id: 'last7', label: '7 Dias' },
        { id: 'last30', label: '30 Dias' },
        { id: 'last60', label: '60 Dias' },
        { id: 'last90', label: '90 Dias' },
        { id: 'thisMonth', label: 'Este Mês' },
    ];

    return (
        <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 ${className}`}>
            <div className="flex flex-wrap bg-gray-50 p-1 rounded-xl gap-0.5">
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => handlePresetChange(preset.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === preset.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-600 hover:text-[#1F2937]'}`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-[#1F2937] text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                    />
                </div>
                <span className="text-gray-400 font-bold">-</span>
                <div className="relative">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-[#1F2937] text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>
        </div>
    );
};

export default DateRangeFilter;
