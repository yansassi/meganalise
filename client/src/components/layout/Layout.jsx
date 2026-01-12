import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ country, setCountry }) {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 90);
    return { startDate: start, endDate: end };
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 transition-colors duration-300 font-sans overflow-hidden">
      <Sidebar country={country} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header country={country} setCountry={setCountry} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <Outlet context={{ country, setCountry, dateRange, setDateRange }} />
        </main>
      </div>
    </div>
  );
}
