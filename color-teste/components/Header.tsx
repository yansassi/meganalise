
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      {/* Title Section */}
      <div>
        <h2 className="text-3xl font-bold text-[#1F2937] mb-1">Painel</h2>
        <p className="text-[#9CA3AF] text-sm font-medium">Visão geral do seu crescimento social</p>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md hidden lg:block">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
        </span>
        <input 
          className="w-full pl-11 pr-4 py-3 rounded-full border-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm text-sm placeholder-gray-400" 
          placeholder="Pesquisar..." 
          type="text"
        />
      </div>

      {/* Right Actions Profile */}
      <div className="flex items-center space-x-4 self-end md:self-auto">
        {/* Flag BR */}
        <div className="w-8 h-8 rounded-full bg-green-600 relative flex items-center justify-center overflow-hidden border border-white shadow-sm cursor-pointer" title="Português">
          <div className="w-4 h-4 bg-yellow-400 transform rotate-45"></div>
          <div className="w-2 h-2 bg-blue-700 rounded-full absolute z-10"></div>
        </div>
        {/* Flag NL */}
        <div className="w-8 h-8 rounded-full bg-white relative overflow-hidden border border-gray-200 shadow-sm cursor-pointer" title="Nederlands">
          <div className="absolute top-0 w-full h-1/3 bg-red-600"></div>
          <div className="absolute bottom-0 w-full h-1/3 bg-blue-700"></div>
        </div>
        {/* Notifications */}
        <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 shadow-sm transition-colors">
          <i className="fa-regular fa-bell text-lg"></i>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        {/* User Profile */}
        <div className="flex items-center pl-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-sm group-hover:ring-2 ring-blue-400 transition-all">
            <i className="fa-solid fa-user text-gray-400 text-xl mt-2"></i>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-[#1F2937] leading-tight">Yan Sassi</p>
            <p className="text-xs text-[#9CA3AF] font-medium">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
