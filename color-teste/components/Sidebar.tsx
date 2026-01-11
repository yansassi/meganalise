
import React from 'react';
import { Platform } from '../types';

interface SidebarProps {
  activePlatform: Platform;
  setActivePlatform: (p: Platform) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePlatform, setActivePlatform }) => {
  const navItems = [
    { id: Platform.PAINEL, label: 'Painel', icon: 'fa-solid fa-table-cells-large' },
    { id: Platform.YOUTUBE, label: 'YouTube', icon: 'fa-brands fa-youtube' },
    { id: Platform.INSTAGRAM, label: 'Instagram', icon: 'fa-brands fa-instagram', hasSubmenu: true },
    { id: Platform.TIKTOK, label: 'TikTok', icon: 'fa-brands fa-tiktok' },
    { id: Platform.FACEBOOK, label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
    { id: Platform.EVIDENCIA, label: 'Evidência', icon: 'fa-solid fa-folder-open' },
    { id: Platform.CONFIGURACOES, label: 'Configurações', icon: 'fa-solid fa-gear' },
  ];

  return (
    <aside className="w-[260px] h-full bg-[#2563EB] flex flex-col flex-shrink-0 text-white shadow-2xl z-20">
      {/* Sidebar Header / Logo */}
      <div className="h-20 flex items-center px-6 border-b border-blue-500/30">
        <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center mr-3 shadow-md">
          <span className="text-[#2563EB] font-bold text-xl">M</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Meganalise</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 no-scrollbar space-y-1">
        {navItems.map((item) => {
          const isActive = activePlatform === item.id;
          
          if (item.id === Platform.INSTAGRAM && isActive) {
            return (
              <div key={item.id} className="mt-2 mb-2">
                {/* Active Instagram Block */}
                <div className="bg-white rounded-xl mx-2 p-3 flex items-center justify-between shadow-lg cursor-pointer transform scale-[1.02] transition-transform">
                  <div className="flex items-center">
                    <i className={`${item.icon} w-6 text-center text-xl text-[#2563EB] mr-2`}></i>
                    <span className="text-[#2563EB] font-bold">{item.label}</span>
                  </div>
                  <i className="fa-solid fa-chevron-up text-[#2563EB] text-xs"></i>
                </div>
                {/* Submenu */}
                <div className="pl-12 pr-4 pt-3 pb-2 space-y-3 mt-2">
                  <div>
                    <span className="bg-white text-blue-600 rounded-full px-4 py-1 text-sm font-bold shadow-sm inline-block">
                      Geral
                    </span>
                  </div>
                  <a className="block text-blue-200 hover:text-white text-sm font-medium transition-colors" href="#">Conteúdo</a>
                  <a className="block text-blue-200 hover:text-white text-sm font-medium transition-colors" href="#">Stories</a>
                  <a className="block text-blue-200 hover:text-white text-sm font-medium transition-colors" href="#">Público</a>
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActivePlatform(item.id)}
              className={`w-full flex items-center px-6 py-3 transition-all ${
                isActive ? 'bg-blue-600' : 'hover:bg-blue-600 opacity-90 hover:opacity-100'
              }`}
            >
              <i className={`${item.icon} w-6 text-center text-lg mr-3`}></i>
              <span className="font-medium">{item.label}</span>
              {item.hasSubmenu && !isActive && (
                <i className="fa-solid fa-chevron-down ml-auto text-[10px] opacity-50"></i>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Action */}
      <div className="p-6 border-t border-blue-500/30">
        <button className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] text-white rounded-lg py-3 px-4 flex items-center justify-center transition-colors shadow-lg">
          <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
          <span className="font-semibold text-sm">Enviar Métricas</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
