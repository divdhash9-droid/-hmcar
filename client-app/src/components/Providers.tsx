'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { SocketProvider } from '@/lib/SocketContext';
import { SettingsProvider } from '@/lib/SettingsContext';
import { ToastProvider } from '@/lib/ToastContext';
import { UIProvider } from '@/lib/UIContext';
import PWAInstaller from './PWAInstaller';
import PWAUpdater from './PWAUpdater';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <LanguageProvider>
            <SettingsProvider>
                <ToastProvider>
                    <UIProvider>
                        <AuthProvider>
                            <SocketProvider>
                                <PWAInstaller />
                                <PWAUpdater />
                                {children}
                            </SocketProvider>
                        </AuthProvider>
                    </UIProvider>
                </ToastProvider>
            </SettingsProvider>
        </LanguageProvider>
    );
}
