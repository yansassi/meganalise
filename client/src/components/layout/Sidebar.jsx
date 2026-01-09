import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [openSubmenu, setOpenSubmenu] = React.useState('Instagram');

  const navItems = [
    { name: 'Painel', icon: 'dashboard', path: '/' },
    { name: 'YouTube', icon: 'smart_display', path: '/platform/youtube' },
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
    { name: 'TikTok', icon: 'music_note', path: '/platform/tiktok' },
    { name: 'Facebook', icon: 'facebook', path: '/platform/facebook' },
    { name: 'Configurações', icon: 'settings', path: '/settings' },
  ];

  const toggleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  return (
    <aside className="hidden lg:flex w-72 bg-sidebar-bg flex-col justify-between h-full flex-shrink-0 z-30 transition-all duration-300 overflow-y-auto custom-scrollbar">
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
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white/10 text-white/70">
            <span className="material-icons-round text-xl">info</span>
          </div>
          <div className="text-xs">
            <p className="text-white font-medium">Meganalise Pro</p>
            <p className="text-gray-500 mt-0.5">v3.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
