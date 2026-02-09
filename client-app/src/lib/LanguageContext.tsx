'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'AR' | 'EN';

interface Translations {
    [key: string]: {
        AR: string;
        EN: string;
    };
}

export const translations: Translations = {
    // Common
    appName: { AR: "إتش إم كار", EN: "HM CAR" },
    auction: { AR: "مزاد", EN: "AUCTION" },
    login: { AR: "دخول", EN: "LOGIN" },
    logout: { AR: "خروج", EN: "LOGOUT" },
    home: { AR: "الرئيسية", EN: "HOME" },
    dashboard: { AR: "لوحة التحكم", EN: "DASHBOARD" },
    register: { AR: "إنشاء حساب", EN: "REGISTER" },
    back: { AR: "عودة", EN: "BACK" },
    save: { AR: "حفظ", EN: "SAVE" },
    delete: { AR: "حذف", EN: "DELETE" },
    edit: { AR: "تعديل", EN: "EDIT" },
    buyNow: { AR: "شراء الآن", EN: "BUY NOW" },

    // Navbar
    showroom: { AR: "المعرض", EN: "SHOWROOM" },
    auctions: { AR: "المزادات", EN: "AUCTIONS" },
    spareParts: { AR: "قطع الغيار", EN: "PARTS" },
    about: { AR: "عن الشركة", EN: "ABOUT" },

    // Auth
    loginTitle: { AR: "مرحباً بعودتك", EN: "WELCOME BACK" },
    loginSubtitle: { AR: "سجل الدخول للوصول إلى ساحة المزادات", EN: "Login to access the auction arena" },
    registerTitle: { AR: "انضم إلى النخبة", EN: "JOIN THE ELITE" },
    registerSubtitle: { AR: "أنشئ حسابك لبدء تجربة اقتناء السيارات الفاخرة", EN: "Create your account to start your luxury automotive journey" },
    email: { AR: "البريد الإلكتروني", EN: "EMAIL ADDRESS" },
    password: { AR: "كلمة المرور", EN: "PASSWORD" },
    fullName: { AR: "الاسم الكامل", EN: "FULL NAME" },
    orContinueWith: { AR: "أو المتابعة بواسطة", EN: "OR CONTINUE WITH" },
    loginAsAdmin: { AR: "حساب مدير", EN: "ADMIN LOGIN" },
    loginAsCustomer: { AR: "حساب عميل", EN: "CLIENT LOGIN" },
    dontHaveAccount: { AR: "ليس لديك حساب؟", EN: "DON'T HAVE AN ACCOUNT?" },
    alreadyHaveAccount: { AR: "لديك حساب بالفعل؟", EN: "ALREADY HAVE AN ACCOUNT?" },

    // Home Page
    heroTitle: { AR: "الوجهة الأمثل للسيارات الفاخرة", EN: "Ultimate Destination for luxury cars" },
    heroSubtitle: { AR: "استكشف عالم المزادات الحصرية والقطع النادرة", EN: "Explore exclusive auctions and rare components" },
    searchPlaceholder: { AR: "ابحث عن سيارة أحلامك...", EN: "Search for your dream car..." },
    allBrands: { AR: "جميع الماركات", EN: "All Brands" },
    priceRange: { AR: "النطاق السعري", EN: "Price Range" },
    searchBtn: { AR: "بحث", EN: "SEARCH" },

    // Showroom
    inventoryTitle: { AR: "معرض النخبة", EN: "ELITE INVENTORY" },
    inventorySubtitle: { AR: "تصفح مجموعتنا المختارة من السيارات الفاخرة", EN: "Browse our curated selection of luxury vehicles" },
    filterAll: { AR: "الكل", EN: "ALL" },
    filterSport: { AR: "رياضية", EN: "SPORT" },
    filterLuxury: { AR: "فاخرة", EN: "LUXURY" },
    filterSuv: { AR: "دفع رباعي", EN: "SUV" },
    viewDetails: { AR: "عرض التفاصيل", EN: "VIEW DETAILS" },
    bidNow: { AR: "زايد الآن", EN: "BID NOW" },

    // Auctions
    arenaTitle: { AR: "ساحة المزادات الحية", EN: "LIVE AUCTION ARENA" },
    arenaSubtitle: { AR: "زايد في الوقت الفعلي على أندر السيارات في العالم", EN: "Bid in real-time on the world's most exclusive machinery" },
    currentBid: { AR: "المزايدة الحالية", EN: "CURRENT BID" },
    timeLeft: { AR: "الوقت المتبقي", EN: "TIME LEFT" },
    activeBidders: { AR: "المزايدون النشطون", EN: "ACTIVE BIDDERS" },
    startingPrice: { AR: "سعر البداية", EN: "STARTING PRICE" },
    ended: { AR: "انتهى المزاد", EN: "ENDED" },

    // Parts
    partsTitle: { AR: "كتالوج قطع الغيار", EN: "COMPONENTS CATALOG" },
    partsSubtitle: { AR: "قطع أصلية مصممة لأداء استثنائي لسيارات النخبة", EN: "Genuine components engineered for elite performance" },
    categoryEngine: { AR: "المحرك", EN: "ENGINE" },
    categoryBody: { AR: "الهيكل", EN: "BODY" },
    categoryInterior: { AR: "المقصورة", EN: "INTERIOR" },
    categoryElectric: { AR: "الكهرباء", EN: "ELECTRIC" },
    stockStatus: { AR: "حالة المخزون", EN: "STOCK STATUS" },
    inStock: { AR: "متوفر", EN: "IN STOCK" },

    // About
    aboutTitle: { AR: "قصتنا وعالمنا", EN: "OUR STORY & WORLD" },
    aboutSubtitle: { AR: "تجسيد للفخامة في عالم السيارات بالمملكة العربية السعودية", EN: "Exbodying luxury in the Saudi Arabian automotive landscape" },
    historyTitle: { AR: "تاريخنا", EN: "HISTORY" },
    historyDesc: { AR: "بدأنا بشغف بسيط للسيارات النادرة وتحولنا اليوم إلى أكبر منصة مزادات في المنطقة.", EN: "We started with a simple passion for rare cars and have grew into the region's largest auction platform." },

    // Dashboard Client
    welcome: { AR: "مرحباً", EN: "Welcome" },
    liveAuctions: { AR: "مزادات مباشرة", EN: "Live Auctions" },
    availableCars: { AR: "سيارات متاحة", EN: "Available Cars" },
    myOrders: { AR: "طلباتي", EN: "My Orders" },
    inProgress: { AR: "قيد المعالجة", EN: "In Progress" },
    eliteMember: { AR: "عضوية النخبة", EN: "ELITE MEMBER" },
    recentBids: { AR: "أحدث المزايدات", EN: "Recent Bids" },
    quickActions: { AR: "إجراءات سريعة", EN: "Quick Actions" },

    // Admin Dashboard
    adminTitle: { AR: "لوحة التحكم الذهبية", EN: "GOLDEN CONTROL PANEL" },
    activeInventory: { AR: "المخزون النشط", EN: "Active Inventory" },
    totalUsers: { AR: "إجمالي المستخدمين", EN: "Total Users" },
    urgentAlerts: { AR: "تنبيهات عاجلة", EN: "Urgent Alerts" },
    successRate: { AR: "معدل النجاح", EN: "Success Rate" },
    addCar: { AR: "إضافة سيارة", EN: "Add Car" },
    createAuction: { AR: "إنشاء مزاد", EN: "Create Auction" },
    manageCategories: { AR: "إدارة الفئات", EN: "Manage Categories" },
    notifications: { AR: "الإشعارات", EN: "Notifications" },
    orders: { AR: "الطلبات", EN: "Orders" },
    settings: { AR: "الإعدادات", EN: "Settings" },
    serverStatus: { AR: "حالة السيرفر", EN: "Server Status" },

    // Admin Car Management
    carManagement: { AR: "إدارة السيارات", EN: "CAR MANAGEMENT" },
    carName: { AR: "اسم السيارة", EN: "Car Name" },
    carBrand: { AR: "الماركة", EN: "Brand" },
    carPrice: { AR: "السعر", EN: "Price" },
    carStatus: { AR: "الحالة", EN: "Status" },
    uploadImage: { AR: "تحميل صورة", EN: "Upload Image" },
};

interface LanguageContextType {
    lang: Language;
    toggleLanguage: () => void;
    t: (key: keyof typeof translations) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>('AR');

    useEffect(() => {
        const savedLang = localStorage.getItem('appLang') as Language;
        if (savedLang) setLang(savedLang);
    }, []);

    const toggleLanguage = () => {
        const newLang = lang === 'AR' ? 'EN' : 'AR';
        setLang(newLang);
        localStorage.setItem('appLang', newLang);
    };

    const t = (key: keyof typeof translations) => {
        return translations[key]?.[lang] || key;
    };

    const isRTL = lang === 'AR';

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t, isRTL }}>
            <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : 'font-sans'}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
