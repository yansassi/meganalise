import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pb } from '../../lib/pocketbase';

const Header = ({ country, setCountry }) => {
    const { user } = useAuth();

    const avatarUrl = user?.avatar
        ? pb.files.getURL(user, user.avatar)
        : null;

    const userName = user?.name || user?.email || 'Usuário';

    return (
        <header className="flex flex-wrap items-center justify-between px-4 md:px-8 py-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Painel</h1>
                <p className="text-slate-400 text-sm mt-0.5">Visão geral do seu crescimento social</p>
            </div>

            <div className="flex-1 max-w-lg hidden md:block">
                <div className="relative group">
                    <span className="material-icons-round absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Pesquisar análises, campanhas..."
                        className="w-full bg-white border-none rounded-3xl py-4 pl-14 pr-6 shadow-soft text-sm focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6 ml-auto">

                {/* Country Selector */}
                <div className="flex items-center bg-white rounded-full p-1 shadow-soft">
                    <button
                        onClick={() => setCountry('BR')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${country === 'BR' ? 'bg-indigo-100 ring-2 ring-primary' : 'hover:bg-gray-100 opacity-50 hover:opacity-100'
                            }`}
                        title="Perfil Brasil"
                    >
                        <img src="https://flagcdn.com/w40/br.png" alt="Brazil" className="w-6 h-auto object-cover rounded-sm" />
                    </button>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    <button
                        onClick={() => setCountry('PY')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${country === 'PY' ? 'bg-indigo-100 ring-2 ring-primary' : 'hover:bg-gray-100 opacity-50 hover:opacity-100'
                            }`}
                        title="Perfil Paraguai"
                    >
                        <img src="https://flagcdn.com/w40/py.png" alt="Paraguay" className="w-6 h-auto object-cover rounded-sm" />
                    </button>
                </div>

                <div className="relative">
                    <button className="p-2.5 rounded-full hover:bg-white text-gray-500 shadow-soft transition-all hover:scale-105 active:scale-95 duration-200">
                        <span className="material-icons-round text-2xl">notifications</span>
                        <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                    </button>
                </div>

                {/* User Profile Link */}
                <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-soft overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-icons-round text-gray-400 text-3xl">person</span>
                        )}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-bold leading-tight truncate max-w-[100px] text-slate-800">{userName}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Gestor Social</p>
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Header;
