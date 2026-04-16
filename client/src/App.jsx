import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Influencers from './pages/Influencers';

import React, { useState } from 'react';
import PlatformView from './components/dashboard/PlatformView';
import StoriesDashboard from './components/dashboard/StoriesDashboard';
import ContentDashboard from './components/dashboard/ContentDashboard';
import InstagramAudienceTab from './components/dashboard/InstagramAudienceTab';
import Evidence from './pages/Evidence';
import Influencer from './pages/Influencer';
import EvidenceDashboard from './pages/EvidenceDashboard';
import TikTokContentDashboard from './components/dashboard/TikTokContentDashboard';
import YouTubeContentDashboard from './components/dashboard/YouTubeContentDashboard';
import YouTubeAudienceTab from './components/dashboard/YouTubeAudienceTab';


// Dashboard retrieves country from Outlet context
import Login from './pages/Login';
import Profile from './pages/Profile';
import UploadMetrics from './pages/UploadMetrics';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Dashboard is now imported from pages/Dashboard
import PresentationView from './components/dashboard/PresentationView';




const Settings = () => (
  <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft">
    <h1 className="text-2xl font-bold mb-4">Configurações</h1>
    <p className="text-gray-500">Configuração do sistema.</p>
  </div>
);

import FacebookContentDashboard from './components/dashboard/FacebookContentDashboard';
import FacebookStoriesDashboard from './components/dashboard/FacebookStoriesDashboard';
import FacebookAudienceTab from './components/dashboard/FacebookAudienceTab';

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
              <Route path="platform/youtube/content" element={<YouTubeContentDashboard />} />
              <Route path="platform/youtube/audience" element={<YouTubeAudienceTab />} />
              <Route path="platform/instagram" element={<PlatformView platform="Instagram" />} />
              <Route path="platform/instagram/content" element={<ContentDashboard />} />
              <Route path="platform/instagram/stories" element={<StoriesDashboard />} />
              <Route path="platform/instagram/audience" element={<InstagramAudienceTab />} />
              <Route path="/upload" element={<UploadMetrics />} />
              <Route path="platform/tiktok" element={<PlatformView platform="TikTok" />} />
              <Route path="platform/tiktok/content" element={<TikTokContentDashboard />} />
              <Route path="platform/facebook" element={<PlatformView platform="Facebook" />} />
              <Route path="platform/facebook/content" element={<FacebookContentDashboard />} />
              <Route path="platform/facebook/stories" element={<FacebookStoriesDashboard />} />
              <Route path="platform/facebook/audience" element={<FacebookAudienceTab />} />
              <Route path="influencers" element={<Influencers />} />
            <Route path="evidence" element={<Evidence />} />
              <Route path="influencer" element={<Influencer />} />
              <Route path="evidence/:id" element={<EvidenceDashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
          <Route path="/presentation/:id" element={<PresentationView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
