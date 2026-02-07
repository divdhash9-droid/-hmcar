// [[ARABIC_HEADER]] هذا الملف (config/redis.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const redis = require('redis');

let client = null;

/**
 * إنشاء اتصال Redis
 */
async function connectRedis() {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('❌ Redis: تجاوز عدد محاولات الاتصال');
            return new Error('Redis connection failed');
          }
          return retries * 100;
        }
      }
    });

    client.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    console.log('⚠️  التطبيق سيعمل بدون Redis caching');
    return null;
  }
}

/**
 * الحصول على قيمة من Cache
 */
async function getCache(key) {
  if (!client || !client.isOpen) return null;
  
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error.message);
    return null;
  }
}

/**
 * حفظ قيمة في Cache
 */
async function setCache(key, value, expiryInSeconds = 3600) {
  if (!client || !client.isOpen) return false;
  
  try {
    await client.setEx(key, expiryInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error.message);
    return false;
  }
}

/**
 * حذف قيمة من Cache
 */
async function deleteCache(key) {
  if (!client || !client.isOpen) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error.message);
    return false;
  }
}

/**
 * حذف جميع القيم التي تبدأ بـ pattern
 */
async function deleteCachePattern(pattern) {
  if (!client || !client.isOpen) return false;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis delete pattern error:', error.message);
    return false;
  }
}

/**
 * Middleware للـ caching
 */
function cacheMiddleware(duration = 3600) {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const cachedData = await getCache(key);

    if (cachedData) {
      console.log(`✅ Cache hit: ${key}`);
      return res.json(cachedData);
    }

    // حفظ الدالة الأصلية
    const originalJson = res.json.bind(res);

    // استبدال res.json لحفظ البيانات في Cache
    res.json = (data) => {
      setCache(key, data, duration);
      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  cacheMiddleware,
  getClient: () => client
};
