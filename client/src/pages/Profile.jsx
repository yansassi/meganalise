
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { pb } from '../lib/pocketbase';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            if (user.avatar) {
                setPreview(pb.files.getUrl(user, user.avatar));
            }
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            if (avatar) {
                formData.append('avatar', avatar);
            }

            await pb.collection('users').update(user.id, formData);
            setSuccess('Perfil atualizado com sucesso!');
        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="flex items-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-icons-round text-3xl">manage_accounts</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Meu Perfil</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie suas informações pessoais.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-soft">
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 flex items-center gap-3 text-green-600 dark:text-green-400">
                        <span className="material-icons-round">check_circle</span>
                        <span className="text-sm font-medium">{success}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400">
                        <span className="material-icons-round">error</span>
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-100 dark:border-white/5">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-card-dark shadow-xl bg-gray-100 dark:bg-white/5">
                                {preview ? (
                                    <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <span className="material-icons-round text-6xl">person</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary transition-colors">
                                <span className="material-icons-round text-xl">edit</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg">{user?.username || user?.email}</h3>
                            <p className="text-gray-400 text-sm">Usuário</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Nome Completo</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-icons-round text-xl">badge</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Email (Não editável)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-icons-round text-xl">email</span>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="px-6 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons-round">logout</span>
                            Sair
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
