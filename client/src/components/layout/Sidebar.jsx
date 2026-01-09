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
    { name: 'Configurações', icon: 'settings', path: '/settings' },
  ];

  const toggleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  const sidebarBgClass = country === 'BR'
    ? 'bg-gradient-to-b from-blue-900 to-slate-900'
    : 'bg-gradient-to-b from-red-900 to-slate-900';

  return (
    <aside className={`hidden lg:flex w-72 ${sidebarBgClass} flex-col justify-between h-full flex-shrink-0 z-30 transition-all duration-300 overflow-y-auto custom-scrollbar`}>
      <div>
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-glow">M</div>
          <span className="text-white text-xl font-bold tracking-tight">Meganalise</span>
        </div>

        <nav className="px-6 space-y-3">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                // Parent Item with Submenu
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group relative text-gray-400 hover:text-white hover:bg-white/5 ${openSubmenu === item.name ? 'text-white bg-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-icons-round text-2xl">{item.icon}</span>
                      <span className="font-semibold text-sm">{item.name}</span>
                    </div>
                    <span className={`material-icons-round transition-transform duration-300 ${openSubmenu === item.name ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {/* Submenu Items */}
                  <div className={`pl-12 space-y-2 overflow-hidden transition-all duration-300 ${openSubmenu === item.name ? 'max-h-52 mt-2' : 'max-h-0'}`}>
                    {item.submenu.map(sub => (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        end={sub.path === item.path} // 'end' ensures exact match for parent path
                        className={({ isActive }) => `block px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
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
                  className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <span className="material-icons-round text-2xl">{item.icon}</span>
                  <span className="font-semibold text-sm">{item.name}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="px-6 pb-8 space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
          <NavLink to="/upload" className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <span className="material-icons-round">cloud_upload</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">Enviar Métricas</p>
              <p className="text-primary-light text-xs truncate opacity-80 group-hover:opacity-100">Upload de CSV</p>
            </div>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
