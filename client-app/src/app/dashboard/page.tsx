'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardRouter() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading, isAdmin } = useAuth();

    useEffect(() => {
        if (isLoading) return; // Wait for auth to be ready

        // Redirect based on role
        if (isAdmin) {
            router.replace('/admin/dashboard');
        } else {
            // All clients go to client dashboard (they are auto-registered)
            router.replace('/client/dashboard');
        }
    }, [isLoading, isAdmin, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-6"
                >
                    <Loader2 className="w-16 h-16 text-cinematic-neon-blue" />
                </motion.div>
                <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-bold">
                    جاري التحويل للوحة التحكم...
                </p>
            </motion.div>
        </div>
    );
}
