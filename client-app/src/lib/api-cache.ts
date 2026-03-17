/**
 * نظام ذاكرة التخزين المؤقت للعميل (Client-side API Cache)
 * يساعد في جعل التنقل بين الصفحات "لحظياً" عبر تخزين استجابات الـ API.
 */

const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30000; // 30 ثانية كحد أقصى للتخزين المؤقت للبيانات المسبقة

export const apiCache = {
    set: (key: string, data: any, ttl = DEFAULT_TTL) => {
        cache.set(key, { data, timestamp: Date.now() + ttl });
    },
    get: (key: string) => {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.timestamp) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    },
    clear: () => cache.clear()
};
