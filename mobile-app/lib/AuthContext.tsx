// lib/AuthContext.tsx - إدارة المصادقة
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    async function loadStoredAuth() {
        try {
            const [storedToken, storedUser] = await Promise.all([
                AsyncStorage.getItem('hm_token'),
                AsyncStorage.getItem('hm_user'),
            ]);
            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser?.role) {
                    setToken(storedToken);
                    setUser(parsedUser);
                }
            }
        } catch {
            // تجاهل الأخطاء
        } finally {
            setIsLoading(false);
        }
    }

    async function login(newToken: string, newUser: User) {
        await Promise.all([
            AsyncStorage.setItem('hm_token', newToken),
            AsyncStorage.setItem('hm_user', JSON.stringify(newUser)),
        ]);
        setToken(newToken);
        setUser(newUser);
    }

    async function logout() {
        await Promise.all([
            AsyncStorage.removeItem('hm_token'),
            AsyncStorage.removeItem('hm_user'),
        ]);
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{
            user, token, isLoggedIn: !!user, isLoading, login, logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
