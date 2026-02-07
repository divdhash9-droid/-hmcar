// [[ARABIC_HEADER]] هذا الملف (services/CacheService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/CacheService.js
 * خدمة التخزين المؤقت باستخدام Redis
 * 
 * الوصف:
 * - توفر تخزين مؤقت سريع للبيانات المتكررة
 * - تدعم TTL (وقت انتهاء الصلاحية) للبيانات
 * - تعمل بدون Redis إذا لم يكن متاحاً
 * 
 * الاستخدام:
 * - cacheService.set(key, value, ttl) - حفظ قيمة
 * - cacheService.get(key) - جلب قيمة
 * - cacheService.delete(key) - حذف قيمة
 */
const Redis = require('ioredis');
const { promisify } = require('util');

class CacheService {
    constructor() {
        if (CacheService.instance) {
            return CacheService.instance;
        }

        const redisUrl = process.env.REDIS_URL
            || (process.env.REDIS_HOST
                ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
                : null);

        // If Redis isn't configured, run without caching silently.
        if (!redisUrl) {
            this.redis = null;
            this.isRedisEnabled = false;
            CacheService.instance = this;
            return;
        }

        let redisErrorLogged = false;

        try {
            this.redis = new Redis(redisUrl, {
                enableOfflineQueue: false,
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
                reconnectOnError: () => false
            });

            this.redis.on('error', (err) => {
                if (!redisErrorLogged) {
                    redisErrorLogged = true;
                    console.warn(`Redis disabled: ${err?.message || err}`);
                }

                this.isRedisEnabled = false;
                const client = this.redis;
                this.redis = null;

                if (client) {
                    try {
                        client.removeAllListeners();
                    } catch (e) { /* ignore */ }
                    if (typeof client.disconnect === 'function') {
                        try { client.disconnect(); } catch (e) { /* ignore */ }
                    }
                }
            });

            this.redis.on('connect', () => {
                console.log('Successfully connected to Redis.');
            });

            this.isRedisEnabled = true;
        } catch (error) {
            console.warn(`Redis is not available. Caching will be disabled. ${error?.message || ''}`.trim());
            this.redis = null;
            this.isRedisEnabled = false;
        }

        CacheService.instance = this;
    }

    async get(key) {
        if (!this.isRedisEnabled) return null;
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Error getting from cache [${key}]:`, error);
            return null;
        }
    }

    async set(key, value, ttlInSeconds = 3600) {
        if (!this.isRedisEnabled) return;
        try {
            const stringValue = JSON.stringify(value);
            await this.redis.set(key, stringValue, 'EX', ttlInSeconds);
        } catch (error) {
            console.error(`Error setting cache [${key}]:`, error);
        }
    }

    async del(key) {
        if (!this.isRedisEnabled) return;
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error(`Error deleting from cache [${key}]:`, error);
        }
    }

    async delWithPattern(pattern) {
        if (!this.isRedisEnabled) return;
        try {
            const stream = this.redis.scanStream({ match: pattern, count: 100 });
            stream.on('data', (keys) => {
                if (keys.length) {
                    const pipeline = this.redis.pipeline();
                    keys.forEach((key) => pipeline.del(key));
                    pipeline.exec();
                }
            });
            await new Promise((resolve) => stream.on('end', resolve));
        } catch (error) {
            console.error(`Error deleting with pattern [${pattern}]:`, error);
        }
    }

    async flushAll() {
        if (!this.isRedisEnabled) return;
        try {
            await this.redis.flushall();
            console.log('Redis cache flushed.');
        } catch (error) {
            console.error('Error flushing Redis:', error);
        }
    }

    /**
     * Caches the result of a function.
     * @param {string} key - The cache key.
     * @param {Function} fn - The async function to execute and cache.
     * @param {number} ttlInSeconds - Time to live in seconds.
     * @returns {Promise<any>} The result from cache or function.
     */
    async remember(key, fn, ttlInSeconds = 3600) {
        let cached = await this.get(key);
        if (cached) {
            return cached;
        }

        const result = await fn();
        if (result !== null && result !== undefined) {
            await this.set(key, result, ttlInSeconds);
        }
        return result;
    }

    /**
     * Caches the result of a function and serves stale data while revalidating.
     * @param {string} key - The cache key.
     * @param {Function} fn - The async function to execute and cache.
     * @param {number} ttlInSeconds - Time to live in seconds.
     * @returns {Promise<any>} The result from cache or function.
     */
    async staleWhileRevalidate(key, fn, ttlInSeconds = 3600) {
        const cached = await this.get(key);

        if (cached) {
            // Return stale data immediately
            // Then, trigger a background revalidation
            fn().then(freshData => {
                if (freshData !== null && freshData !== undefined) {
                    this.set(key, freshData, ttlInSeconds);
                }
            }).catch(err => {
                console.error(`SWR background update failed for key [${key}]:`, err);
            });
            return cached;
        }

        const result = await fn();
        if (result !== null && result !== undefined) {
            await this.set(key, result, ttlInSeconds);
        }
        return result;
    }

    async disconnect() {
        if (this.isRedisEnabled && this.redis) {
            await this.redis.quit();
            this.isRedisEnabled = false;
        }
    }
}

module.exports = new CacheService();

