import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

import React, { useState } from 'react';
import { instagramParser } from './services/instagramParser';
import PlatformView from './components/dashboard/PlatformView';
import StoriesDashboard from './components/dashboard/StoriesDashboard';
import ContentDashboard from './components/dashboard/ContentDashboard';
import InstagramAudienceTab from './components/dashboard/InstagramAudienceTab';
import Evidence from './pages/Evidence';
import EvidenceDashboard from './pages/EvidenceDashboard';
import TikTokContentDashboard from './components/dashboard/TikTokContentDashboard';


// Dashboard retrieves country from Outlet context
import Login from './pages/Login';
import Profile from './pages/Profile';
import UploadMetrics from './pages/UploadMetrics';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Dashboard is now imported from pages/Dashboard



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
              <Route path="platform/tiktok/content" element={<TikTokContentDashboard />} />
              <Route path="platform/facebook" element={<PlatformView platform="Facebook" />} />
              <Route path="evidence" element={<Evidence />} />
              <Route path="evidence/:id" element={<EvidenceDashboard />} />
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
