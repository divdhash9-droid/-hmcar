'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

interface User {
    _id: string;
    name: string;
    username?: string;
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
                    // التحقق من أن البيانات سليمة
                    if (userData && userData.role) {
                        setUser(userData);
                    } else {
                        // بيانات ناقصة - امسح كل شيء
                        clearAuth();
                    }
                } catch {
                    clearAuth();
                }
            } else {
                // لا يوجد token أو user - تأكد من مسح الـ cookies
                clearCookies();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            clearAuth();
        } finally {
            setIsLoading(false);
        }
    }

    function clearCookies() {
        if (typeof document !== 'undefined') {
            document.cookie = 'hm_token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'hm_user_role=; path=/; max-age=0; SameSite=Lax';
        }
    }

    function clearAuth() {
        localStorage.removeItem('hm_token');
        localStorage.removeItem('hm_user');
        localStorage.removeItem('hm_user_role');
        clearCookies();
        setUser(null);
    }

    function refreshUser() {
        checkExistingLogin();
    }

    function logout() {
        clearAuth();
        // إعادة توجيه للصفحة الرئيسية بعد الخروج
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
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
