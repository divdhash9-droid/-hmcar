'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { SocketProvider } from '@/lib/SocketContext';
import { SettingsProvider } from '@/lib/SettingsContext';
import { ToastProvider } from '@/lib/ToastContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <LanguageProvider>
            <SettingsProvider>
                <ToastProvider>
                    <AuthProvider>
                        <SocketProvider>
                            {children}
                        </SocketProvider>
                    </AuthProvider>
                </ToastProvider>
            </SettingsProvider>
        </LanguageProvider>
    );
}
