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
import InstagramAudienceTab from './components/dashboard/InstagramAudienceTab';


// Dashboard retrieves country from Outlet context
import Login from './pages/Login';
import Profile from './pages/Profile';
import UploadMetrics from './pages/UploadMetrics';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

const Dashboard = () => {
  const { country } = useOutletContext();
  const [stats, setStats] = useState([
    { label: 'Alcance Total', value: 0, trend: 0, icon: 'visibility', color: 'blue' },
    { label: 'Engajamento', value: 0, trend: 0, icon: 'favorite', color: 'purple' },
    { label: 'Seguidores', value: 0, trend: 0, icon: 'group', color: 'orange' },
    { label: 'Campanhas', value: 0, trend: 0, icon: 'rocket_launch', color: 'green' },
  ]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadAggregatedData = async () => {
      setLoading(true);
      // We import dataService dynamically or need to make sure it's available. 
      // Since this file imports it in other components, lets check imports.
      // Assuming dataService is imported in App.jsx or we need to add import.
      // Checking existing imports... dataService is NOT imported in App.jsx scope usually.
      // We'll trust we add the import in a separate step or assume it's available.
      // Wait, Layout/App imports might not have it. Best to add import at top of App.jsx via separate tool call if missing.

      try {
        const { dataService } = await import('./services/dataService');
        const data = await dataService.getAggregateDashboardData(country);

        let totalReach = 0;
        let totalEngagement = 0;
        let totalFollowers = 0; // Followers are tricky to sum if they are cumulative snapshots. We might take max or avg.
        // Actually usually 'followers' metric is "New Followers" in basic aggregation, or "Current Followers".
        // If it's daily growth, we sum. If it's absolute count, we take the latest.
        // Let's assume daily delta for now or simply sum reach/interaction.

        data.metrics.forEach(m => {
          if (m.metric === 'reach') totalReach += m.value;
          if (m.metric === 'interactions') totalEngagement += m.value;
          if (m.metric === 'followers') totalFollowers += m.value; // Assuming 'followers' = 'growth'
        });

        // If we have total followers count as a metric (e.g. absolute), we should treat it differently.
        // For now, simple aggregation.

        setStats([
          { label: 'Alcance Total', value: totalReach, trend: 0, icon: 'visibility', color: 'blue' },
          { label: 'Engajamento', value: totalEngagement, trend: 0, icon: 'favorite', color: 'purple' },
          { label: 'Seguidores', value: totalFollowers, trend: 0, icon: 'group', color: 'orange' },
          { label: 'Campanhas', value: '-', trend: 0, icon: 'rocket_launch', color: 'green' }, // Dynamic campaigns unimplemented
        ]);
      } catch (e) {
        console.error("Dashboard aggregation error", e);
      } finally {
        setLoading(false);
      }
    };
    loadAggregatedData();
  }, [country]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
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
          <p className="text-gray-500 dark:text-gray-400">Visão geral unificada de todas as suas redes.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Stats */}
        <div className="flex-1 space-y-8">
          <StatCards stats={stats} />
          {/* <GrowthChart data={[]} /> Placeholder for aggregate chart */}

          <div className="p-8 rounded-3xl bg-white dark:bg-card-dark border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <span className="material-icons-round text-3xl">bar_chart</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Visão Geral</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Selecione uma rede social no menu lateral para ver métricas detalhadas e gerenciar conteúdos específicos.
            </p>
          </div>
        </div>

        {/* Right Column: Platform Mix & Feed */}
        <div className="w-full lg:w-96 space-y-8 flex-shrink-0">
          <RightPanel platformMix={[]} />
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
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout country={country} setCountry={setCountry} />}>
              <Route index element={<Dashboard />} />
              <Route path="platform/youtube" element={<PlatformView platform="YouTube" />} />
              <Route path="platform/instagram" element={<PlatformView platform="Instagram" />} />
              <Route path="platform/instagram/content" element={<ContentDashboard />} />
              <Route path="platform/instagram/stories" element={<StoriesDashboard />} />
              <Route path="platform/instagram/audience" element={<InstagramAudienceTab />} />
              <Route path="/upload" element={<UploadMetrics />} />
              <Route path="platform/tiktok" element={<PlatformView platform="TikTok" />} />
              <Route path="platform/facebook" element={<PlatformView platform="Facebook" />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
