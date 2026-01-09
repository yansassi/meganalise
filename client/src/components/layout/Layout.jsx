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
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white transition-colors duration-300 font-sans overflow-hidden">
      <Sidebar country={country} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleTheme={toggleDarkMode} country={country} setCountry={setCountry} isDarkMode={darkMode} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <Outlet context={{ country, setCountry }} />
        </main>
      </div>
    </div>
  );
}
