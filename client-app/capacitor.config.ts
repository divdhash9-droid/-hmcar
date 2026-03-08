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
    // وضع الخادم: يشير لموقعك المنشور على Vercel
    // هذا يعني أن التطبيق يعرض موقعك المباشر
    // ──────────────────────────────────────────
    server: {
        url: 'https://car-auction-sand.vercel.app',
        cleartext: false,
        androidScheme: 'https',
    },

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
