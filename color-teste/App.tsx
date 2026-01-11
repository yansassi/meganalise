
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import GrowthChart from './components/GrowthChart';
import { Platform } from './types';
import { METRICS, SECONDARY_METRICS } from './constants';

const App: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [activeTab, setActiveTab] = useState<'Resumo' | 'Público' | 'Estratégia'>('Resumo');

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6] text-[#1F2937]">
      {/* Sidebar component */}
      <Sidebar 
        activePlatform={activePlatform} 
        setActivePlatform={setActivePlatform} 
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar p-6 lg:p-10">
        <Header />

        {/* Tabs Navigation */}
        <div className="flex items-center space-x-10 mb-8 border-b border-gray-200 pb-px">
          <button 
            onClick={() => setActiveTab('Resumo')}
            className={`pb-4 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'Resumo' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Resumo
          </button>
          <button 
            onClick={() => setActiveTab('Público')}
            className={`pb-4 border-b-2 font-bold text-sm flex items-center transition-all ${
              activeTab === 'Público' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Público
            <span className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          </button>
          <button 
            onClick={() => setActiveTab('Estratégia')}
            className={`pb-4 border-b-2 font-bold text-sm flex items-center transition-all ${
              activeTab === 'Estratégia' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Estratégia
            <i className="fa-solid fa-bolt ml-2 text-yellow-400 text-xs"></i>
          </button>
        </div>

        {/* Stats Grid 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {METRICS.map((metric, idx) => (
            <StatsCard key={idx} {...metric} />
          ))}
        </div>

        {/* Stats Grid 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {SECONDARY_METRICS.map((metric, idx) => (
            <StatsCard key={idx} {...metric} />
          ))}
        </div>

        {/* Chart Section */}
        <GrowthChart />
        
        {/* Simple Footer spacing */}
        <div className="h-10"></div>
      </main>
    </div>
  );
};

export default App;
