import { CapacitorConfig } from '@capacitor/cli';

/**
 * إعدادات Capacitor لتطبيق HM CAR
 * ─────────────────────────────────
 * appId   : معرّف التطبيق الفريد (يُستخدم في المتجرين)
 * appName : الاسم المعروض
 * webDir  : مجلد البناء الثابت (يُنتجه next build عند BUILD_TARGET=mobile)
 */
const config: CapacitorConfig = {
    appId: 'com.hmcar.app',
    appName: 'HM CAR',
    webDir: 'out',

    // ──────────────────────────────────────────
    // وضع الخادم: استخدمه فقط إذا أردت عرض الموقع المباشر داخل التطبيق
    // لتفعيل الفصل بين التطبيق والموقع، اتركه فارغاً أو استخدم CAP_SERVER_URL
    // ──────────────────────────────────────────
    ...(process.env.CAP_SERVER_URL ? {
        server: {
            url: process.env.CAP_SERVER_URL,
            cleartext: false,
            androidScheme: 'https',
        }
    } : {}),

    // ──────────────────────────────────────────
    // إعدادات الإضافات
    // ──────────────────────────────────────────
    plugins: {
        SplashScreen: {
            launchShowDuration: 2500,
            launchAutoHide: true,
            backgroundColor: '#000000',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
        StatusBar: {
            style: 'Dark',
            backgroundColor: '#000000',
            overlaysWebView: false,
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        Keyboard: {
            resize: 'body',
            resizeOnFullScreen: true,
        },
    },

    // ──────────────────────────────────────────
    // إعدادات Android
    // ──────────────────────────────────────────
    android: {
        buildOptions: {
            keystorePath: 'release.keystore',
            keystorePassword: process.env.KEYSTORE_PASSWORD || '',
            keystoreAlias: 'hmcar',
            keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD || '',
        },
    },

    // ──────────────────────────────────────────
    // إعدادات iOS
    // ──────────────────────────────────────────
    ios: {
        scheme: 'HM CAR',
        preferredContentMode: 'mobile',
    },
};

export default config;
