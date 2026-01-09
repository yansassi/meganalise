import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import Layout from './components/layout/Layout';
import StatCards from './components/dashboard/StatCards';
import GrowthChart from './components/dashboard/GrowthChart';
import ContentTable from './components/dashboard/ContentTable';
import RightPanel from './components/dashboard/RightPanel';
import React, { useState } from 'react';
import { instagramParser } from './services/instagramParser';
import PlatformView from './components/dashboard/PlatformView';
import StoriesDashboard from './components/dashboard/StoriesDashboard';
import ContentDashboard from './components/dashboard/ContentDashboard';

// Dashboard retrieves country from Outlet context
const Dashboard = () => {
  const { country } = useOutletContext();

  // Data Placeholders - can be connected to real API later
  const stats = [
    { label: 'Total Reach', value: '-', trend: 0, icon: 'visibility', color: 'blue' },
    { label: 'Engagement', value: '-', trend: 0, icon: 'favorite', color: 'purple' },
    { label: 'Followers', value: '-', trend: 0, icon: 'group', color: 'orange' },
    { label: 'Campaigns', value: '-', trend: 0, icon: 'rocket_launch', color: 'green' },
  ];

  const chartData = []; // Empty chart
  const contentItems = []; // Empty table
  const platformMix = []; // Empty mix

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-icons-round text-3xl">waving_hand</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Bem-vindo de volta!</h2>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold border border-gray-200 dark:border-white/10">
              {country === 'BR' ? '🇧🇷 Perfil Brasil' : '🇵🇾 Perfil Paraguai'}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Visão geral da atividade do seu sistema.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Stats, Charts, Table */}
        <div className="flex-1 space-y-8">
          <StatCards stats={stats} />
          <GrowthChart data={chartData} />
          <ContentTable items={contentItems} />
        </div>

        {/* Right Column: Platform Mix & Feed */}
        <div className="w-full lg:w-96 space-y-8 flex-shrink-0">
          <RightPanel platformMix={platformMix} />
        </div>
      </div>
    </div>
  );
};


const Settings = () => (
  <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft">
    <h1 className="text-2xl font-bold mb-4">Configurações</h1>
    <p className="text-gray-500">Configuração do sistema.</p>
  </div>
);

function App() {
  const [country, setCountry] = useState('BR');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout country={country} setCountry={setCountry} />}>
          <Route index element={<Dashboard />} />
          <Route path="platform/youtube" element={<PlatformView platform="YouTube" />} />
          <Route path="platform/instagram" element={<PlatformView platform="Instagram" />} />
          <Route path="platform/instagram/content" element={<ContentDashboard />} />
          <Route path="platform/instagram/stories" element={<StoriesDashboard />} />
          <Route path="platform/tiktok" element={<PlatformView platform="TikTok" />} />
          <Route path="platform/facebook" element={<PlatformView platform="Facebook" />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
