'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function PWAUpdater() {
    const { isRTL } = useLanguage();

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const showUpdateAlert = () => {
            window.dispatchEvent(new CustomEvent('hm_smart_alert', {
                detail: {
                    id: 'pwa-update-' + Date.now(),
                    title: isRTL ? 'تحديث جديد متوفر' : 'UPDATE AVAILABLE',
                    message: isRTL 
                        ? 'نسخة سينمائية جديدة جاهزة للتثبيت.' 
                        : 'A new cinematic version is ready for you.',
                    type: 'system',
                    actionLabel: isRTL ? 'تحديث الآن' : 'UPDATE NOW',
                    onAction: () => {
                        window.location.reload();
                    }
                }
            }));
        };

        // [[ARABIC_COMMENT]] الاستماع لرسالة التحديث من Service Worker
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                console.log('[HM CAR] New version detected via message:', event.data.version);
                showUpdateAlert();
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        // [[ARABIC_COMMENT]] فحص التحديثات
        const checkUpdate = async () => {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    console.log('[HM CAR] Checking for app updates...');
                    await registration.update();
                    
                    // [[ARABIC_COMMENT]] في بعض المتصفحات، التحقق من التحول لحالة waiting يدوياً
                    if (registration.waiting) {
                        showUpdateAlert();
                    }
                }
            } catch (err) {
                console.warn('[HM CAR] Update check failed:', err);
            }
        };

        // فحص أولي بعد 5 ثوانٍ
        const initialTimeout = setTimeout(checkUpdate, 5000);

        // فحص دوري كل 15 دقيقة (للمستخدمين اللي يتركون التطبيق مفتوح لفترة طويلة)
        const pollInterval = setInterval(checkUpdate, 15 * 60 * 1000);

        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
            clearTimeout(initialTimeout);
            clearInterval(pollInterval);
        };
    }, [isRTL]);

    return null; // لا نحتاج واجهة محلية، نستخدم Smart Island
}
