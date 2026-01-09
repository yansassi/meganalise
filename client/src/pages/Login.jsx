
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error("Login failed:", err);
            setError('Falha ao entrar. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob"></div>
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000"></div>
            </div>

            <div className="bg-white/80 dark:bg-card-dark/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-soft w-full max-w-md border border-white/20 z-10 relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <span className="material-icons-round text-3xl">lock</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Bem-vindo</h1>
                    <p className="text-gray-500 dark:text-gray-400">Insira suas credenciais para acessar o sistema.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400">
                        <span className="material-icons-round">error</span>
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-icons-round text-xl">email</span>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Senha</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-icons-round text-xl">vpn_key</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <a href="#" className="text-sm text-primary font-medium hover:text-opacity-80">Esqueceu a senha?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Entrando...</span>
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-white/10">
                    <p className="text-sm text-gray-500">
                        Não tem uma conta?{' '}
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-primary font-bold hover:underline"
                        >
                            Registrar-se
                        </button>
                    </p>
                </div>
            </div>

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowModal(false)}
                    ></div>
                    <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-2xl max-w-sm w-full relative z-10 animate-bounce-in">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#25D366]">
                                <span className="material-icons-round text-3xl">add_reaction</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Criar Nova Conta</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Para criar sua conta e ter acesso ao sistema, por favor entre em contato diretamente com o administrador e criador: <br />
                                <strong className="text-primary">Yan Sassi</strong>
                            </p>

                            <a
                                href="https://wa.me/5545988349638"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[#25D366] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                            >
                                <span className="material-icons-round">chat</span>
                                Contatar via WhatsApp
                            </a>

                            <button
                                onClick={() => setShowModal(false)}
                                className="mt-4 text-gray-400 hover:text-gray-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
