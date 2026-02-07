// [[ARABIC_HEADER]] هذا الملف (middleware/autoCache.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Auto-Caching Middleware
 * Middleware للتخزين التلقائي للاستجابات
 */

const { multiLevelGet, multiLevelSet } = require('../services/cache/strategies');
const crypto = require('crypto');

/**
 * إنشاء مفتاح cache بناءً على الطلب
 */
function generateCacheKey(req) {
  const { method, originalUrl, query, body } = req;
  const userId = req.session?.user?._id || 'anonymous';
  
  const keyData = {
    method,
    url: originalUrl,
    query,
    userId
  };
  
  // Include body for POST requests (be careful with sensitive data)
  if (method === 'POST' && body) {
    // Exclude sensitive fields
    const { password, token, ...safeBody } = body;
    keyData.body = safeBody;
  }
  
  const keyString = JSON.stringify(keyData);
  const hash = crypto.createHash('md5').update(keyString).digest('hex');
  
  return `api:cache:${hash}`;
}

/**
 * Middleware for automatic API caching
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {Array<string>} options.methods - HTTP methods to cache (default: ['GET'])
 * @param {Function} options.shouldCache - Custom function to determine if response should be cached
 * @param {Array<RegExp>} options.excludePaths - Paths to exclude from caching
 */
function autoCacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    methods = ['GET'],
    shouldCache = null,
    excludePaths = []
  } = options;

  return async (req, res, next) => {
    // Skip if method is not cacheable
    if (!methods.includes(req.method)) {
      return next();
    }

    // Skip excluded paths
    const isExcluded = excludePaths.some(pattern => pattern.test(req.path));
    if (isExcluded) {
      return next();
    }

    // Skip if authenticated and caching authenticated requests is not enabled
    if (req.session?.user && !options.cacheAuthenticated) {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      // Try to get from cache
      const cachedResponse = await multiLevelGet(cacheKey);
      
      if (cachedResponse) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        // Set content type if available
        if (cachedResponse.contentType) {
          res.set('Content-Type', cachedResponse.contentType);
        }
        
        // Send cached response
        if (cachedResponse.json) {
          return res.json(cachedResponse.data);
        } else {
          return res.send(cachedResponse.data);
        }
      }

      // Cache miss - intercept response
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Store original methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      // Override json method
      res.json = function(data) {
        // Check if response should be cached
        const cacheable = shouldCache 
          ? shouldCache(req, res, data) 
          : res.statusCode === 200;

        if (cacheable) {
          multiLevelSet(cacheKey, {
            data,
            json: true,
            contentType: 'application/json',
            statusCode: res.statusCode
          }, ttl).catch(err => {
            console.error('Cache save error:', err);
          });
        }

        return originalJson(data);
      };

      // Override send method
      res.send = function(data) {
        // Check if response should be cached
        const cacheable = shouldCache 
          ? shouldCache(req, res, data) 
          : res.statusCode === 200;

        if (cacheable && typeof data === 'string') {
          multiLevelSet(cacheKey, {
            data,
            json: false,
            contentType: res.get('Content-Type'),
            statusCode: res.statusCode
          }, ttl).catch(err => {
            console.error('Cache save error:', err);
          });
        }

        return originalSend(data);
      };

      next();
    } catch (error) {
      console.error('Auto-cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache on data modification
 */
function cacheInvalidationMiddleware(patterns) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { invalidateByTag } = require('../services/cache/advanced');
        
        for (const pattern of patterns) {
          try {
            if (typeof pattern === 'string') {
              await invalidateByTag(pattern);
            } else if (typeof pattern === 'function') {
              const tags = await pattern(req);
              for (const tag of tags) {
                await invalidateByTag(tag);
              }
            }
          } catch (error) {
            console.error('Cache invalidation error:', error);
          }
        }
      }
    };

    res.json = function(data) {
      invalidateCache().catch(err => console.error('Async invalidation error:', err));
      return originalJson(data);
    };

    res.send = function(data) {
      invalidateCache().catch(err => console.error('Async invalidation error:', err));
      return originalSend(data);
    };

    next();
  };
}

/**
 * Conditional caching based on request headers
 */
function conditionalCacheMiddleware(options = {}) {
  return async (req, res, next) => {
    // Check for Cache-Control header from client
    const cacheControl = req.get('Cache-Control');
    
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        req.skipCache = true;
        return next();
      }
      
      // Parse max-age if present
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        req.cacheMaxAge = parseInt(maxAgeMatch[1]);
      }
    }

    // Check ETag
    const ifNoneMatch = req.get('If-None-Match');
    if (ifNoneMatch) {
      // ETag logic can be implemented here
      // For now, just continue
    }

    next();
  };
}

module.exports = {
  autoCacheMiddleware,
  cacheInvalidationMiddleware,
  conditionalCacheMiddleware,
  generateCacheKey
};
