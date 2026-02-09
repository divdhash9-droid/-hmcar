'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

interface User {
    _id: string;
    name: string;
    email?: string;
    role: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isLoggedIn = !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';

    // Check existing login on mount
    useEffect(() => {
        checkExistingLogin();
    }, []);

    function checkExistingLogin() {
        setIsLoading(true);

        try {
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem('hm_token');
            const userStr = localStorage.getItem('hm_user');

            if (token && userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    setUser(userData);
                } catch (e) {
                    // Invalid data
                    localStorage.removeItem('hm_token');
                    localStorage.removeItem('hm_user');
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function refreshUser() {
        checkExistingLogin();
    }

    function logout() {
        localStorage.removeItem('hm_token');
        localStorage.removeItem('hm_user');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            isLoading,
            isAdmin,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}
