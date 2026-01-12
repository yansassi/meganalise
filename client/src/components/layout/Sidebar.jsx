import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ country }) => {
  const [openSubmenu, setOpenSubmenu] = React.useState('Instagram');

  const navItems = [
    { name: 'Painel', icon: 'dashboard', path: '/' },
    {
      name: 'YouTube',
      icon: 'smart_display',
      path: '/platform/youtube',
      submenu: [
        { name: 'Geral', path: '/platform/youtube' },
      ]
    },
    {
      name: 'Instagram',
      icon: 'photo_camera',
      path: '/platform/instagram',
      submenu: [
        { name: 'Geral', path: '/platform/instagram' },
        { name: 'Conteúdo', path: '/platform/instagram/content' },
        { name: 'Stories', path: '/platform/instagram/stories' },
        { name: 'Público', path: '/platform/instagram/audience' }
      ]
    },
    {
      name: 'TikTok',
      icon: 'music_note',
      path: '/platform/tiktok',
      submenu: [
        { name: 'Geral', path: '/platform/tiktok' },
        { name: 'Conteúdo', path: '/platform/tiktok/content' },
      ]
    },
    {
      name: 'Facebook',
      icon: 'facebook',
      path: '/platform/facebook',
      submenu: [
        { name: 'Geral', path: '/platform/facebook' },
      ]
    },
    {
      name: 'Evidência',
      icon: 'folder_special',
      path: '/evidence'
    },
    {
      name: 'Influenciadores',
      icon: 'person',
      path: '/influencer'
    },
    { name: 'Configurações', icon: 'settings', path: '/settings' },
  ];

  const toggleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  // Solid vibrant blue for sidebar
  const sidebarValues = country === 'BR'
    ? { bg: 'bg-[#2563EB]', activeText: 'text-[#2563EB]' }
    : { bg: 'bg-[#DC2626]', activeText: 'text-[#DC2626]' };

  return (
    <aside className={`hidden lg:flex w-72 ${sidebarValues.bg} flex-col justify-between h-full flex-shrink-0 z-30 transition-all duration-500 shadow-2xl overflow-y-auto custom-scrollbar`}>
      <div>
        <div className="p-8 flex items-center gap-4 animate-entrance">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl font-black shadow-lg">
            <span className={sidebarValues.activeText}>M</span>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight drop-shadow-sm">Meganalise</span>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                // Parent Item with Submenu
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group relative font-medium 
                    ${openSubmenu === item.name
                        ? 'bg-white/10 text-white shadow-inner'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-icons-round text-2xl">{item.icon}</span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className={`material-icons-round transition-transform duration-300 opacity-70 ${openSubmenu === item.name ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {/* Submenu Items */}
                  <div className={`pl-4 pr-2 space-y-1 overflow-hidden transition-all duration-500 ease-out ${openSubmenu === item.name ? 'max-h-96 mt-2 mb-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {item.submenu.map(sub => (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        end={sub.path === item.path}
                        className={({ isActive }) => `block px-4 py-2.5 text-sm font-medium rounded-xl transition-all ml-8 border-l-2
                          ${isActive
                            ? 'bg-white text-slate-800 shadow-lg border-transparent translate-x-1'
                            : 'text-white/60 border-white/10 hover:text-white hover:border-white/50 hover:bg-white/5'
                          }`}
                      >
                        {sub.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : (
                // Regular Item
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative font-medium
                    ${isActive
                      ? `bg-white ${sidebarValues.activeText} shadow-xl scale-[1.02]`
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <span className="material-icons-round text-2xl">{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="px-6 pb-6 pt-6 border-t border-blue-500/30">
        <NavLink to="/upload" className={`w-full text-white rounded-lg py-3 px-4 flex items-center justify-center transition-colors shadow-lg ${country === 'PY' ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#1E40AF] hover:bg-[#1e3a8a]'
          }`}>
          <span className="material-icons-round mr-2">cloud_upload</span>
          <span className="font-semibold text-sm">Enviar Métricas</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
