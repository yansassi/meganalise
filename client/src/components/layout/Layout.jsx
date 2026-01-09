import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ country, setCountry }) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 dark:text-gray-100 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-300">
        <Header
          onToggleTheme={toggleDarkMode}
          country={country}
          setCountry={setCountry}
        />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet context={{ country, setCountry }} />
          </div>
        </div>
      </main>
    </div>
  );
}
