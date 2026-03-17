'use client';

/**
 * سياق اللغة والترجمة (LanguageContext)
 * المسؤول عن إدارة لغات التطبيق (العربية، الإنجليزية، الكورية).
 * يحتوي على قاموس الترجمات ووظائف التبديل بين اللغات.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'AR' | 'EN' | 'KR';

interface Translations {
    [key: string]: {
        AR: string;
        EN: string;
        KR: string;
    };
}

export const translations: Translations = {
    // Common
    appName: { AR: "إتش إم كار", EN: "HM CAR", KR: "HM 카" },
    auction: { AR: "مزاد", EN: "AUCTION", KR: "경매" },
    login: { AR: "دخول", EN: "LOGIN", KR: "로그인" },
    logout: { AR: "خروج", EN: "LOGOUT", KR: "로그아웃" },
    home: { AR: "الرئيسية", EN: "HOME", KR: "홈" },
    dashboard: { AR: "لوحة التحكم", EN: "DASHBOARD", KR: "대시보드" },
    register: { AR: "إنشاء حساب", EN: "REGISTER", KR: "회원가입" },
    back: { AR: "عودة", EN: "BACK", KR: "뒤로" },
    save: { AR: "حفظ", EN: "SAVE", KR: "저장" },
    delete: { AR: "حذف", EN: "DELETE", KR: "삭제" },
    edit: { AR: "تعديل", EN: "EDIT", KR: "편집" },
    buyNow: { AR: "شراء الآن", EN: "BUY NOW", KR: "지금 구매" },

    // Navbar
    showroom: { AR: "المعرض", EN: "SHOWROOM", KR: "전시장" },
    auctions: { AR: "المزادات", EN: "AUCTIONS", KR: "경매" },
    spareParts: { AR: "قطع الغيار", EN: "PARTS", KR: "부품" },
    about: { AR: "عن الشركة", EN: "ABOUT", KR: "회사 소개" },

    // Auth
    loginTitle: { AR: "مرحباً بعودتك", EN: "WELCOME BACK", KR: "환영합니다" },
    loginSubtitle: { AR: "سجل الدخول للوصول إلى ساحة المزادات", EN: "Login to access the auction arena", KR: "경매장에 입장하려면 로그인하세요" },
    registerTitle: { AR: "انضم إلى النخبة", EN: "JOIN THE ELITE", KR: "정회원 가입" },
    registerSubtitle: { AR: "أنشئ حسابك لبدء تجربة اقتناء السيارات الفاخرة", EN: "Create your account to start your luxury automotive journey", KR: "럭셔리 자동차 여정을 시작하려면 계정을 만드세요" },
    email: { AR: "البريد الإلكتروني", EN: "EMAIL ADDRESS", KR: "이메일 주소" },
    password: { AR: "كلمة المرور", EN: "PASSWORD", KR: "비밀번호" },
    fullName: { AR: "الاسم الكامل", EN: "FULL NAME", KR: "성함" },
    orContinueWith: { AR: "أو المتابعة بواسطة", EN: "OR CONTINUE WITH", KR: "또는 다음으로 계속" },
    loginAsAdmin: { AR: "حساب مدير", EN: "ADMIN LOGIN", KR: "관리자 로그인" },
    loginAsCustomer: { AR: "حساب عميل", EN: "CLIENT LOGIN", KR: "고객 로그인" },
    dontHaveAccount: { AR: "ليس لديك حساب؟", EN: "DON'T HAVE AN ACCOUNT?", KR: "계정이 없으신가요?" },
    alreadyHaveAccount: { AR: "لديك حساب بالفعل؟", EN: "ALREADY HAVE AN ACCOUNT?", KR: "이미 계정이 있으신가요?" },

    // Home Page
    heroTitle: { AR: "الوجهة الأمثل للسيارات الفاخرة", EN: "Ultimate Destination for luxury cars", KR: "럭셔리 자동차의 궁극적인 목적지" },
    heroSubtitle: { AR: "استكشف عالم المزادات الحصرية والقطع النادرة", EN: "Explore exclusive auctions and rare components", KR: "독점 경매 및 희귀 부품 세계 탐험" },
    searchPlaceholder: { AR: "ابحث عن سيارة أحلامك...", EN: "Search for your dream car...", KR: "꿈의 자동차를 검색하세요..." },
    allBrands: { AR: "جميع الماركات", EN: "All Brands", KR: "모든 브랜드" },
    priceRange: { AR: "النطاق السعري", EN: "Price Range", KR: "가격 도면" },
    searchBtn: { AR: "بحث", EN: "SEARCH", KR: "검색" },

    // Showroom
    inventoryTitle: { AR: "معرض النخبة", EN: "ELITE INVENTORY", KR: "엘리트 인벤토리" },
    inventorySubtitle: { AR: "تصفح مجموعتنا المختارة من السيارات الفاخرة", EN: "Browse our curated selection of luxury vehicles", KR: "엄선된 럭셔리 자동차 컬렉션을 둘러보세요" },
    filterAll: { AR: "الكل", EN: "ALL", KR: "전체" },
    filterSport: { AR: "رياضية", EN: "SPORT", KR: "스포츠" },
    filterLuxury: { AR: "فاخرة", EN: "LUXURY", KR: "럭셔리" },
    filterSuv: { AR: "دفع رباعي", EN: "SUV", KR: "SUV" },
    viewDetails: { AR: "عرض التفاصيل", EN: "VIEW DETAILS", KR: "상세 보기" },
    bidNow: { AR: "زايد الآن", EN: "BID NOW", KR: "지금 입찰" },

    // Auctions
    arenaTitle: { AR: "ساحة المزادات الحية", EN: "LIVE AUCTION ARENA", KR: "라이브 경매장" },
    arenaSubtitle: { AR: "زايد في الوقت الفعلي على أندر السيارات في العالم", EN: "Bid in real-time on the world's most exclusive machinery", KR: "세계에서 가장 독점적인 차량에 실시간으로 입찰하세요" },
    currentBid: { AR: "المزايدة الحالية", EN: "CURRENT BID", KR: "현재 입찰가" },
    timeLeft: { AR: "الوقت المتبقي", EN: "TIME LEFT", KR: "남은 시간" },
    activeBidders: { AR: "المزايدون النشطون", EN: "ACTIVE BIDDERS", KR: "활성 입찰자" },
    startingPrice: { AR: "سعر البداية", EN: "STARTING PRICE", KR: "시작 가격" },
    ended: { AR: "انتهى المزاد", EN: "ENDED", KR: "경매 종료" },

    // Parts
    partsTitle: { AR: "كتالوج قطع الغيار", EN: "COMPONENTS CATALOG", KR: "부품 카탈로그" },
    partsSubtitle: { AR: "قطع أصلية مصممة لأداء استثنائي لسيارات النخبة", EN: "Genuine components engineered for elite performance", KR: "엘리트 성능을 위해 설계된 순정 부품" },
    categoryEngine: { AR: "المحرك", EN: "ENGINE", KR: "엔진" },
    categoryBody: { AR: "الهيكل", EN: "BODY", KR: "바디" },
    categoryInterior: { AR: "المقصورة", EN: "INTERIOR", KR: "인테리어" },
    categoryElectric: { AR: "الكهرباء", EN: "ELECTRIC", KR: "전기" },
    stockStatus: { AR: "حالة المخزون", EN: "STOCK STATUS", KR: "재고 상태" },
    inStock: { AR: "متوفر", EN: "IN STOCK", KR: "재고 있음" },

    // About
    aboutTitle: { AR: "قصتنا وعالمنا", EN: "OUR STORY & WORLD", KR: "우리의 이야기와 세계" },
    aboutSubtitle: { AR: "تجسيد للفخامة في عالم السيارات بالمملكة العربية السعودية", EN: "Exbodying luxury in the Saudi Arabian automotive landscape", KR: "사우디아라비아 자동차 환경의 럭셔리 구현" },
    historyTitle: { AR: "تاريخنا", EN: "HISTORY", KR: "연혁" },
    historyDesc: { AR: "بدأنا بشغف بسيط للسيارات النادرة وتحولنا اليوم إلى أكبر منصة مزادات في المنطقة.", EN: "We started with a simple passion for rare cars and have grew into the region's largest auction platform.", KR: "희귀 자동차에 대한 소박한 열정으로 시작하여 오늘날 지역 최대의 경매 플랫폼으로 성장했습니다." },

    // Dashboard Client
    welcome: { AR: "مرحباً", EN: "Welcome", KR: "환영합니다" },
    liveAuctions: { AR: "مزادات مباشرة", EN: "Live Auctions", KR: "라이브 경매" },
    availableCars: { AR: "سيارات متاحة", EN: "Available Cars", KR: "이용 가능한 차량" },
    myOrders: { AR: "طلباتي", EN: "My Orders", KR: "내 주문" },
    inProgress: { AR: "قيد المعالجة", EN: "In Progress", KR: "진행 중" },
    eliteMember: { AR: "عضوية النخبة", EN: "ELITE MEMBER", KR: "우수 회원" },
    recentBids: { AR: "أحدث المزايدات", EN: "Recent Bids", KR: "최근 입찰" },
    quickActions: { AR: "إجراءات سريعة", EN: "Quick Actions", KR: "빠른 메뉴" },

    // Admin Dashboard
    adminTitle: { AR: "لوحة التحكم الذهبية", EN: "GOLDEN CONTROL PANEL", KR: "골든 제어판" },
    activeInventory: { AR: "المخزون النشط", EN: "Active Inventory", KR: "활성 재고" },
    totalUsers: { AR: "إجمالي المستخدمين", EN: "Total Users", KR: "총 사용자" },
    urgentAlerts: { AR: "تنبيهات عاجلة", EN: "Urgent Alerts", KR: "긴급 알림" },
    successRate: { AR: "معدل النجاح", EN: "Success Rate", KR: "성공률" },
    addCar: { AR: "إضافة سيارة", EN: "Add Car", KR: "차량 추가" },
    createAuction: { AR: "إنشاء مزاد", EN: "Create Auction", KR: "경매 생성" },
    manageCategories: { AR: "إدارة الفئات", EN: "Manage Categories", KR: "카테고리 관리" },
    notifications: { AR: "الإشعارات", EN: "Notifications", KR: "알림" },
    orders: { AR: "الطلبات", EN: "Orders", KR: "주문" },
    settings: { AR: "الإعدادات", EN: "Settings", KR: "설정" },
    serverStatus: { AR: "حالة السيرفر", EN: "Server Status", KR: "서버 상태" },

    // Social
    social: { AR: "التواصل الاجتماعي", EN: "Social", KR: "소셜" },
    socialSettings: { AR: "إعدادات التواصل", EN: "Social Settings", KR: "소셜 설정" },
    whatsappNumber: { AR: "رقم واتساب", EN: "WhatsApp Number", KR: "WhatsApp 번호" },
    socialLinks: { AR: "روابط التواصل", EN: "Social Links", KR: "소셜 링크" },
    addLink: { AR: "إضافة رابط", EN: "Add Link", KR: "링크 추가" },
    platform: { AR: "المنصة", EN: "Platform", KR: "플랫폼" },
    url: { AR: "الرابط", EN: "URL", KR: "URL" },
    saveChanges: { AR: "حفظ التغييرات", EN: "Save Changes", KR: "변경 사항 저장" },
    publicSocialPage: { AR: "صفحتنا الاجتماعية", EN: "Our Social Page", KR: "공식 소셜 페이지" },
    followUs: { AR: "تابعنا", EN: "Follow Us", KR: "팔로우" },
    contactUs: { AR: "تواصل معنا", EN: "Contact Us", KR: "문의하기" },
    supportChat: { AR: "دعم العملاء", EN: "Customer Support", KR: "고객 지원" },
    describeIssue: { AR: "اكتب مشكلتك هنا...", EN: "Describe your issue...", KR: "여기에 문제를 설명하세요..." },
    send: { AR: "إرسال", EN: "Send", KR: "보내기" },
    submitted: { AR: "تم الإرسال", EN: "Submitted", KR: "제출됨" },
    failed: { AR: "فشل الإرسال", EN: "Failed to submit", KR: "제출 실패" },
    brands: { AR: "الوكالات", EN: "Agencies", KR: "대리점" },
    addBrand: { AR: "إضافة وكالة", EN: "Add Agency", KR: "대리점 추가" },
    brandName: { AR: "اسم الوكالة", EN: "Agency Name", KR: "대리점 이름" },
    brandLogo: { AR: "شعار الوكالة", EN: "Agency Logo", KR: "대리점 로고" },
    brandCategory: { AR: "تصنيف الوكالة", EN: "Agency Category", KR: "대리점 카테고리" },
    brandCars: { AR: "معرض السيارات", EN: "Car Showroom", KR: "차량 전시장" },
    brandParts: { AR: "قطع الغيار", EN: "Spare Parts", KR: "예비 부품" },
    brandBoth: { AR: "كلاهما", EN: "Both", KR: "둘 다" },
    browseCars: { AR: "معرض HM CAR", EN: "HM CAR SHOWROOM", KR: "HM CAR 전시장" },

    // Admin Car Management
    carManagement: { AR: "إدارة السيارات", EN: "CAR MANAGEMENT", KR: "차량 관리" },
    carName: { AR: "اسم السيارة", EN: "Car Name", KR: "차량 이름" },
    carBrand: { AR: "الماركة", EN: "Brand", KR: "브랜드" },
    carPrice: { AR: "السعر", EN: "Price", KR: "가격" },
    carStatus: { AR: "الحالة", EN: "Status", KR: "상태" },
    uploadImage: { AR: "تحميل صورة", EN: "Upload Image", KR: "이미지 업로드" },
};

interface LanguageContextType {
    lang: Language;
    toggleLanguage: () => void;
    t: (key: keyof typeof translations) => string;
    rawText: (text: string) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// [[ARABIC_HEADER]] هذا الملف مسؤول عن إدارة اللغات في التطبيق (العربية، الإنجليزية، والكورية).
/**
 * مزود سياق اللغة (LanguageProvider)
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // تهيئة اللغة مباشرة من المتصفح أو التخزين المحلي لتجنب التحديث المتأخر عند التحميل
    const [lang, setLang] = useState<Language>(() => {
        if (typeof window === 'undefined') return 'AR';
        const cookieMatch = document.cookie.match(/(?:^|; )appLang=([^;]+)/);
        const cookieLang = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        const storedLang = localStorage.getItem('appLang') as Language | null;

        // التحقق من صحة اللغة المخزنة
        if (cookieLang === 'EN' || cookieLang === 'AR' || cookieLang === 'KR') return cookieLang as Language;
        if (storedLang === 'EN' || storedLang === 'AR' || storedLang === 'KR') return storedLang as Language;
        return 'AR'; // اللغة الافتراضية
    });

    /**
     * حفظ اللغة المختارة في التخزين المحلي وملفات البريد (Cookies)
     */
    const persistLang = (value: Language) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('appLang', value);
        document.cookie = `appLang=${value}; path=/; max-age=${60 * 60 * 24 * 365};`; // صلاحية لمدة سنة
    };

    useEffect(() => {
        persistLang(lang);
    }, [lang]);

    const toggleLanguage = () => {
        // التنقل التتابعي بين اللغات (عربي -> إنجليزي -> كوري -> عربي)
        const nextLang: Record<Language, Language> = {
            'AR': 'EN',
            'EN': 'KR',
            'KR': 'AR'
        };
        setLang(nextLang[lang]);
    };

    const t = (key: keyof typeof translations): string => {
        return translations[key]?.[lang] || String(key);
    };

    const rawText = (text: string): string => text;
    const isRTL = lang === 'AR'; // هل اللغة الحالية تدعم الكتابة من اليمين لليسار؟

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t, rawText, isRTL }}>
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
