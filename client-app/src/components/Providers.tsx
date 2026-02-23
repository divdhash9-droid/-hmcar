'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { SocketProvider } from '@/lib/SocketContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <SocketProvider>
                    {children}
                </SocketProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
