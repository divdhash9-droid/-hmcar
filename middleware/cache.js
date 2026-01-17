// [[ARABIC_HEADER]] هذا الملف (middleware/cache.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const cacheService = require('../services/CacheService');

/**
 * Generates a cache key based on the request URL and query parameters.
 * @param {object} req - The request object.
 * @returns {string} The generated cache key.
 */
const generateCacheKey = (req) => {
    // Normalize the base URL and sort query parameters for consistency
    const url = req.originalUrl.split('?')[0];
    const query = Object.keys(req.query)
        .sort()
        .map(key => `${key}=${req.query[key]}`)
        .join('&');
    return `route:${req.method}:${url}${query ? '?' + query : ''}`;
};

/**
 * Middleware to cache responses for GET requests.
 * @param {number} ttlInSeconds - Time to live for the cache entry.
 * @returns {Function} The middleware function.
 */
const cacheResponse = (ttlInSeconds = 60) => {
    return async (req, res, next) => {
        if (req.method !== 'GET' || !cacheService.isRedisEnabled) {
            return next();
        }

        const key = generateCacheKey(req);

        try {
            const cachedData = await cacheService.get(key);
            if (cachedData) {
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Expires-In', ttlInSeconds);
                return res.status(cachedData.status).json(cachedData.body);
            }

            res.set('X-Cache', 'MISS');

            // Monkey-patch res.send to cache the response
            const originalSend = res.send;
            res.send = (body) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const cacheEntry = {
                        status: res.statusCode,
                        body: JSON.parse(body) // Assuming body is JSON string
                    };
                    cacheService.set(key, cacheEntry, ttlInSeconds).catch(err => {
                        console.error(`Cache set error for key [${key}]:`, err);
                    });
                }
                return originalSend.call(res, body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Middleware to automatically invalidate cache based on request method.
 * @param {string|string[]} patterns - A glob pattern or array of patterns to invalidate.
 *                                     Example: '/api/cars*' or ['/api/cars/:id', '/api/auctions*']
 * @returns {Function} The middleware function.
 */
const invalidateCache = (patterns) => {
    return async (req, res, next) => {
        const methodsToInvalidate = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!methodsToInvalidate.includes(req.method) || !cacheService.isRedisEnabled) {
            return next();
        }

        // Invalidate after the request is successfully handled
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const patternsToClear = Array.isArray(patterns) ? patterns : [patterns];
                patternsToClear.forEach(pattern => {
                    // Construct a pattern that matches the route cache format
                    const searchPattern = `route:GET:${pattern}`;
                    cacheService.delWithPattern(searchPattern).catch(err => {
                        console.error(`Cache invalidation error for pattern [${searchPattern}]:`, err);
                    });
                });
            }
        });

        next();
    };
};

module.exports = {
    cacheResponse,
    invalidateCache,
    generateCacheKey
};

