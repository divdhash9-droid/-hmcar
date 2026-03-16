// [[ARABIC_HEADER]] هذا الملف (client-app/src/lib/api.ts) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const isBrowser = typeof window !== 'undefined';
// الأفضل استخدام الرابط الثابت في الإنتاج إذا كان العميل والارسال منفصلين
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://car-auction-sand.vercel.app';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Don't set Content-Type for FormData — let the browser set it with the boundary
    const isFormData = options.body instanceof FormData;

    const defaultHeaders: Record<string, string> = isFormData
        ? { 'Accept': 'application/json' }
        : { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    // If using JWT from local storage
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('hm_token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const defaultOptions: RequestInit = {
        ...options,
        cache: 'no-store', // Disable aggressive Next.js built-in fetch caching
        headers: {
            ...defaultHeaders,
            ...(options.headers as Record<string, string> || {}),
        },
    };

    console.log(`[API Request] ${options.method || 'GET'} ${url}`, options.body && !isFormData ? JSON.parse(options.body as string) : options.body);

    try {
        const response = await fetch(url, defaultOptions);
        console.log(`[API Response Status] ${response.status} for ${url}`);

        const data = await response.json().catch(() => ({}));
        console.log(`[API Response Data]`, data);

        if (!response.ok) {
            let message = data.message || data.error || `فشل الطلب: ${response.status}`;
            
            // [[ARABIC_COMMENT]] معالجة خاصة لرسالة تخطي عدد الطلبات المسموح به
            if (response.status === 429) {
                message = 'لقد قمت بعدد كبير من المحاولات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.';
            }

            const customError: any = new Error(message);
            customError.status = response.status;
            customError.banned = data.banned;
            customError.banCode = data.banCode;
            throw customError;
        }

        return data;
    } catch (error: any) {
        console.error(`[API Error] ${url}:`, error);
        throw error;
    }
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export const api = {
    auth: {
        login: (credentials: object) => fetchAPI('/api/v2/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        // التسجيل/الدخول التلقائي للعملاء
        autoLogin: (data: { name: string; password: string; deviceId?: string }) =>
            fetchAPI('/api/v2/auth/auto-login', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        sendOtp: (payload: { phone: string }) =>
            fetchAPI('/api/v2/auth/otp/send', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        verifyOtp: (payload: { phone: string; code: string }) =>
            fetchAPI('/api/v2/auth/otp/verify', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        register: (data: object) => fetchAPI('/api/v2/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        verify: () => fetchAPI('/api/v2/auth/verify'),
        logout: () => fetchAPI('/api/v2/auth/logout', {
            method: 'POST',
        }),
        changePassword: (data: object) => fetchAPI('/api/v2/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    analytics: {
        // ملخص إحصائي للداشبورد
        // [[ARABIC_COMMENT]] period اختياري لدعم الفلاتر الزمنية من الواجهة
        getSummary: (period?: 'all' | 'week' | 'month' | 'year') =>
            fetchAPI(`/api/v2/analytics${period ? `?period=${period}` : ''}`),
        // أحدث الأنشطة
        getActivities: (limit = 10) => fetchAPI(`/api/v2/analytics/activities?limit=${limit}`),
        // إحصائيات تفصيلية
        // [[ARABIC_COMMENT]] يرجع الرسم الشهري + أفضل المبيعات وفق period
        getDetailed: (period?: 'all' | 'week' | 'month' | 'year') =>
            fetchAPI(`/api/v2/analytics/detailed${period ? `?period=${period}` : ''}`),
    },
    users: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/users?${query}`);
        },
        getProfile: () => fetchAPI('/api/v2/users/profile'),
        updateProfile: (data: object) => fetchAPI('/api/v2/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        create: (data: object) => fetchAPI('/api/v2/users', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: object) => fetchAPI(`/api/v2/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        updateRole: (id: string, role: string) => fetchAPI(`/api/v2/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),
        ban: (id: string, banned: boolean) => fetchAPI(`/api/v2/users/${id}/ban`, {
            method: 'PATCH',
            body: JSON.stringify({ banned }),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/users/${id}`, { method: 'DELETE' }),
    },
    cars: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/cars?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/cars/${id}`),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/cars', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/cars/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id: string) => fetchAPI(`/api/v2/cars/${id}`, {
            method: 'DELETE'
        }),
        getStyles: () => fetchAPI('/api/v2/cars/makes'),
        // [[ARABIC_COMMENT]] تعليم السيارة كـ "مباعة" - تختفي من المعرض فوراً
        markSold: (id: string, soldPrice?: number) => fetchAPI(`/api/v2/cars/${id}/sold`, {
            method: 'PATCH',
            body: JSON.stringify({ soldPrice }),
        }),
    },
    auctions: {
        list: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchAPI(`/api/v2/auctions?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/auctions/${id}`),
        placeBid: (id: string, amount: number) => fetchAPI(`/api/v2/auctions/${id}/bid`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
        }),
        create: (data: any) => fetchAPI('/api/v2/auctions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/auctions/${id}`, {
            method: 'DELETE',
        }),
        update: (id: string, data: any) => fetchAPI(`/api/v2/auctions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    },
    parts: {
        list: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchAPI(`/api/v2/parts?${query}`);
        },
        create: (data: any) => fetchAPI('/api/v2/parts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchAPI(`/api/v2/parts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/parts/${id}`, {
            method: 'DELETE',
        }),
        scrape: () => fetchAPI('/api/v2/parts/scrape', {
            method: 'POST'
        }),
        toggleStock: (id: string) => fetchAPI(`/api/v2/parts/${id}/toggle-stock`, {
            method: 'PATCH'
        }),
    },
    dashboard: {
        getClientData: () => fetchAPI('/api/v2/dashboard/client'),
        getAdminData: () => fetchAPI('/api/v2/dashboard/admin'),
    },
    orders: {
        list: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchAPI(`/api/v2/orders?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/orders/${id}`),
        create: (data: any) => fetchAPI('/api/v2/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, status: string) => fetchAPI(`/api/v2/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/orders/${id}`, { method: 'DELETE' }),
    },
    upload: {
        image: (formData: FormData) => fetchAPI('/api/v2/upload', {
            method: 'POST',
            body: formData,
        }),
    },

    brands: {
        list: (category?: 'cars' | 'parts', options?: { targetShowroom?: 'hm_local' | 'korean_import'; includeInactive?: boolean }) => {
            const params = new URLSearchParams();
            if (category) params.set('category', category);
            if (options?.targetShowroom) params.set('targetShowroom', options.targetShowroom);
            if (options?.includeInactive) params.set('includeInactive', 'true');
            const query = params.toString();
            return fetchAPI(`/api/v2/brands${query ? `?${query}` : ''}`);
        },
        create: (data: { name: string; logoUrl?: string; category: 'cars' | 'parts' | 'both' }) =>
            fetchAPI('/api/v2/brands', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        update: (id: string, data: any) =>
            fetchAPI(`/api/v2/brands/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            fetchAPI(`/api/v2/brands/${id}`, {
                method: 'DELETE',
            }),
    },
    favorites: {
        list: () => fetchAPI('/api/v2/favorites'),
        check: (carId: string) => fetchAPI(`/api/v2/favorites/check/${carId}`),
        add: (carId: string) => fetchAPI('/api/v2/favorites', {
            method: 'POST',
            body: JSON.stringify({ carId }),
        }),
        remove: (carId: string) => fetchAPI(`/api/v2/favorites/${carId}`, {
            method: 'DELETE',
        }),
        clear: () => fetchAPI('/api/v2/favorites', {
            method: 'DELETE',
        }),
    },
    bids: {
        myBids: () => fetchAPI('/api/v2/bids/my'),
        auctionBids: (auctionId: string, limit?: number) =>
            fetchAPI(`/api/v2/bids/auction/${auctionId}?limit=${limit || 20}`),
        place: (auctionId: string, amount: number) => fetchAPI('/api/v2/bids', {
            method: 'POST',
            body: JSON.stringify({ auctionId, amount }),
        }),
        highest: (auctionId: string) => fetchAPI(`/api/v2/bids/highest/${auctionId}`),
    },
    reviews: {
        list: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchAPI(`/api/v2/reviews?${query}`);
        },
        carReviews: (carId: string) => fetchAPI(`/api/v2/reviews/car/${carId}`),
        add: (carId: string, rating: number, comment?: string) => fetchAPI('/api/v2/reviews', {
            method: 'POST',
            body: JSON.stringify({ carId, rating, comment }),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/reviews/${id}`, {
            method: 'DELETE',
        }),
    },
    messages: {
        conversations: () => fetchAPI('/api/v2/messages/conversations'),
        conversation: (userId: string, page?: number) =>
            fetchAPI(`/api/v2/messages/conversation/${userId}?page=${page || 1}`),
        send: (receiverId: string, content: string) => fetchAPI('/api/v2/messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content }),
        }),
        getSupportMessages: () => fetchAPI('/api/v2/messages/support'),
        sendSupportMessage: (content: string) => fetchAPI('/api/v2/messages/support', {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
        markRead: (messageId: string) => fetchAPI(`/api/v2/messages/${messageId}/read`, {
            method: 'PATCH',
        }),
        unreadCount: () => fetchAPI('/api/v2/messages/unread-count'),
    },
    comparisons: {
        get: () => fetchAPI('/api/v2/comparisons'),
        add: (carId: string) => fetchAPI('/api/v2/comparisons/add', {
            method: 'POST',
            body: JSON.stringify({ carId }),
        }),
        remove: (carId: string) => fetchAPI(`/api/v2/comparisons/remove/${carId}`, {
            method: 'DELETE',
        }),
        clear: () => fetchAPI('/api/v2/comparisons/clear', {
            method: 'DELETE',
        }),
        compare: (carIds: string[]) => fetchAPI('/api/v2/comparisons/compare', {
            method: 'POST',
            body: JSON.stringify({ carIds }),
        }),
    },
    contact: {
        send: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
            fetchAPI('/api/v2/contact', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        list: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchAPI(`/api/v2/contact?${query}`);
        },
        updateStatus: (id: string, status: string) =>
            fetchAPI(`/api/v2/contact/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }),
        delete: (id: string) =>
            fetchAPI(`/api/v2/contact/${id}`, {
                method: 'DELETE',
            }),
    },
    liveAuctions: {
        list: (params: any = {}) => {
            const query = new URLSearchParams(params).toString();
            return fetchAPI(`/api/v2/live-auctions?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}`),
        create: (data: any) => fetchAPI('/api/v2/live-auctions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchAPI(`/api/v2/live-auctions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}`, {
            method: 'DELETE',
        }),
        start: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}/start`, {
            method: 'POST',
        }),
        end: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}/end`, {
            method: 'POST',
        }),
    },
    smartAlerts: {
        list: () => fetchAPI('/api/v2/smart-alerts'),
        stats: () => fetchAPI('/api/v2/smart-alerts/stats'),
        create: (data: any) => fetchAPI('/api/v2/smart-alerts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchAPI(`/api/v2/smart-alerts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        toggle: (id: string) => fetchAPI(`/api/v2/smart-alerts/${id}/toggle`, {
            method: 'PATCH',
        }),
        delete: (id: string) => fetchAPI(`/api/v2/smart-alerts/${id}`, {
            method: 'DELETE',
        }),
    },
    settings: {
        // جلب الإعدادات العامة (بدون توثيق)
        getPublic: () => fetchAPI('/api/v2/settings/public'),
        // جلب كل الإعدادات (للأدمن)
        getAll: () => fetchAPI('/api/v2/settings'),
        // تحديث روابط التواصل الاجتماعي
        updateSocialLinks: (data: { socialLinks: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/social-links', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث معلومات الاتصال
        updateContactInfo: (data: { contactInfo: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/contact-info', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث معلومات الموقع
        updateSiteInfo: (data: { siteInfo: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/site-info', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث إعدادات العملة
        updateCurrencySettings: (data: { currencySettings: Record<string, unknown> }) =>
            fetchAPI('/api/v2/settings/currency-settings', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث ميزات "لماذا تختارنا"
        updateFeatures: (data: { features: Array<Record<string, string>> }) =>
            fetchAPI('/api/v2/settings/features', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث محتوى الصفحة الرئيسية
        updateHomeContent: (data: { homeContent: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/home-content', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // ── جلب إعدادات الإعلانات (للأدمن) ──
        getAdvertising: () => fetchAPI('/api/v2/settings/advertising'),
        // ── تحديث إعدادات الإعلانات (للأدمن) ──
        updateAdvertising: (data: { advertisingSettings: Record<string, unknown> }) =>
            fetchAPI('/api/v2/settings/advertising', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
    },
    // ── الطلبات الخاصة (Concierge) ──
    concierge: {
        // إرسال طلب جديد (سيارة أو قطع غيار)
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/concierge', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        // جلب جميع الطلبات (للأدمن)
        list: (params: Record<string, string | number> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/concierge?${query}`);
        },
        // إحصائيات الطلبات الخاصة
        stats: () => fetchAPI('/api/v2/concierge/stats'),
        // تحديث حالة طلب
        updateStatus: (id: string, status: string) => fetchAPI(`/api/v2/concierge/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
        // حذف طلب
        delete: (id: string) => fetchAPI(`/api/v2/concierge/${id}`, { method: 'DELETE' }),
    },
    // ── المعرض الكوري (Encar) ──
    showroom: {
        // جلب سيارات المعرض (الصفحة رقم page)
        getCars: (page = 1) => fetchAPI(`/api/v2/showroom/cars?page=${page}`),
        // جلب إعدادات المعرض (للأدمن)
        getSettings: () => fetchAPI('/api/v2/showroom/settings'),
        // تحديث رابط Encar (للأدمن)
        updateSettings: (data: { encarUrl: string }) => fetchAPI('/api/v2/showroom/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        scrape: () => fetchAPI('/api/v2/showroom/scrape', {
            method: 'POST'
        }),
    },
    // ── الإشعارات (Notifications) ──
    notifications: {
        list: () => fetchAPI('/api/v2/notifications'),
        markRead: () => fetchAPI('/api/v2/notifications/read', { method: 'POST' }),
        send: (data: { title: string; message: string; type: string; actionUrl?: string }) => fetchAPI('/api/v2/notifications/send', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        broadcast: (title: string, message: string, url?: string) => fetchAPI('/api/v2/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify({ title, message, url }),
        }),
    },
    // ── الأمن والحماية (Security) ──
    security: {
        getDevices: () => fetchAPI('/api/v2/security/devices'),
        banDevice: (banCode: string, banned: boolean, reason?: string) =>
            fetchAPI('/api/v2/security/devices/ban', {
                method: 'POST',
                body: JSON.stringify({ banCode, banned, reason }),
            }),
        exemptDevice: (banCode: string, exempt: boolean) =>
            fetchAPI('/api/v2/security/devices/exempt', {
                method: 'POST',
                body: JSON.stringify({ banCode, exempt }),
            }),
        deleteDevice: (id: string) => fetchAPI(`/api/v2/security/devices/${id}`, { method: 'DELETE' }),
    },
};
