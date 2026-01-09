
import React, { createContext, useState, useEffect, useContext } from 'react';
import { pb } from '../lib/pocketbase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(pb.authStore.model);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check auth state on load
        setUser(pb.authStore.model);
        setLoading(false);

        // Listen to auth state changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        return await pb.collection('users').authWithPassword(email, password);
    };

    const logout = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
