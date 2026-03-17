'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * مدير إشعارات الـ Push لنظام PWA
 * يقوم بطلب الصلاحية وتسجيل اشتراك الجهاز في الخلفية
 */
const VAPID_PUBLIC_KEY = 'BNghi5tZPhPvYdmdEEPQPn6M5xuonh0cUsBRpdKjPsy1a9MusGgJuVFZcaE_-t38LfJmeHdIznWWQKfjuUviRVc';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+') // تحويل تنسيق Base64 الخاص بالعناوين إلى تنسيق قياسي
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  useEffect(() => {
    async function sendSubscriptionToBackend(subscription: PushSubscription) {
      try {
        const deviceInfo = {
          browser: navigator.userAgent,
          os: navigator.platform,
          deviceId: localStorage.getItem('hm_device_id') || 'web-pwa'
        };

        await api.notifications.subscribePush(subscription, deviceInfo);
      } catch (error) {
        console.error('[Push] Failed to sync with backend:', error);
      }
    }

    async function requestAndSubscribe(registration: ServiceWorkerRegistration) {
      try {
        // طلب الإذن من المستخدم
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // إنشاء اشتراك جديد
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        await sendSubscriptionToBackend(subscription);
        console.log('[Push] User successfully subscribed');
      } catch (error) {
        console.error('[Push] Failed to subscribe user:', error);
      }
    }

    // التحقق من دعم المتصفح لنظام الإشعارات واستمرارية الاشتراك الفعال
    async function initPush() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Browser does not support push notifications');
        return;
      }

      // التحقق مما إذا كان المستخدم مسجل دخول
      const user = localStorage.getItem('hm_user');
      if (!user) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        
        // التحقق من وجود اشتراك مسبق
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // تحديث بيانات الاشتراك في كل مرة لضمان مزامنة التوكين مع الخادم
          await sendSubscriptionToBackend(subscription);
        } else {
          // إذا لم يكن هناك اشتراك، نطلب الصلاحية ونشترك
          await requestAndSubscribe(registration);
        }
      } catch (error) {
        console.error('[Push] Initialization failed:', error);
      }
    }

    // تأخير بسيط لضمان استقرار باقي الكومبوننتس
    const timeout = setTimeout(initPush, 5000);
    return () => clearTimeout(timeout);
  }, []);

  // هذا الكومبوننت لا يظهر شيئاً في الواجهة، يعمل في الخلفية
  return null;
}
