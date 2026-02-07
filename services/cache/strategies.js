// [[ARABIC_HEADER]] هذا الملف (services/cache/strategies.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Advanced Caching Strategies
 * استراتيجيات تخزين متقدمة للأداء الأمثل
 */

const connection = require('./connection');
const { get, set, del } = require('./basic');

/**
 * Cache Aside Pattern (Lazy Loading)
 * جلب من الذاكرة أولاً، وإذا لم توجد البيانات، جلبها من قاعدة البيانات
 */
async function cacheAside(key, fetchFunction, ttl = 3600) {
  try {
    // محاولة الجلب من الذاكرة المؤقتة
    let data = await get(key);
    
    if (data) {
      return { data, fromCache: true };
    }

    // إذا لم توجد، جلبها من مصدرها
    data = await fetchFunction();
    
    if (data) {
      await set(key, data, ttl);
    }

    return { data, fromCache: false };
  } catch (error) {
    console.error('Cache aside strategy error:', error);
    // في حالة الخطأ، جلب البيانات مباشرة
    const data = await fetchFunction();
    return { data, fromCache: false };
  }
}

/**
 * Write Through Pattern
 * كتابة البيانات في الذاكرة المؤقتة وقاعدة البيانات معاً
 */
async function writeThrough(key, data, saveFunction, ttl = 3600) {
  try {
    // حفظ في قاعدة البيانات
    const savedData = await saveFunction(data);
    
    // حفظ في الذاكرة المؤقتة
    await set(key, savedData, ttl);
    
    return savedData;
  } catch (error) {
    console.error('Write through strategy error:', error);
    throw error;
  }
}

/**
 * Write Behind (Write Back) Pattern
 * كتابة البيانات في الذاكرة المؤقتة أولاً ثم في قاعدة البيانات بشكل غير متزامن
 */
async function writeBehind(key, data, saveFunction, ttl = 3600) {
  try {
    // حفظ فوري في الذاكرة المؤقتة
    await set(key, data, ttl);
    
    // حفظ غير متزامن في قاعدة البيانات
    setImmediate(() => {
      saveFunction(data).catch(err => {
        console.error('Write behind async save error:', err);
      });
    });
    
    return data;
  } catch (error) {
    console.error('Write behind strategy error:', error);
    throw error;
  }
}

/**
 * Refresh Ahead Pattern
 * تحديث البيانات في الذاكرة المؤقتة قبل انتهاء صلاحيتها
 */
async function refreshAhead(key, fetchFunction, ttl = 3600, refreshThreshold = 0.8) {
  try {
    if (!connection.isConnected) {
      return await fetchFunction();
    }

    const data = await get(key);
    
    if (data) {
      // التحقق من الوقت المتبقي
      const remainingTTL = await connection.client.ttl(key);
      const refreshTime = ttl * refreshThreshold;
      
      // إذا اقترب من الانتهاء، جلب بيانات جديدة في الخلفية
      if (remainingTTL < refreshTime) {
        setImmediate(() => {
          fetchFunction()
            .then(freshData => set(key, freshData, ttl))
            .catch(err => console.error('Refresh ahead error:', err));
        });
      }
      
      return data;
    }

    // إذا لم توجد، جلبها وحفظها
    const freshData = await fetchFunction();
    if (freshData) {
      await set(key, freshData, ttl);
    }
    
    return freshData;
  } catch (error) {
    console.error('Refresh ahead strategy error:', error);
    return await fetchFunction();
  }
}

/**
 * Multi-Level Cache
 * تخزين متعدد المستويات (Memory + Redis)
 */
const memoryCache = new Map();
const MEMORY_CACHE_SIZE = 100; // حد أقصى 100 عنصر في الذاكرة

async function multiLevelGet(key) {
  try {
    // المستوى 1: Memory Cache (الأسرع)
    if (memoryCache.has(key)) {
      const cached = memoryCache.get(key);
      if (Date.now() < cached.expiry) {
        return cached.data;
      }
      memoryCache.delete(key);
    }

    // المستوى 2: Redis Cache
    const data = await get(key);
    
    if (data) {
      // حفظ في Memory Cache أيضاً
      if (memoryCache.size >= MEMORY_CACHE_SIZE) {
        // حذف أقدم عنصر
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
      }
      
      memoryCache.set(key, {
        data,
        expiry: Date.now() + 60000 // دقيقة واحدة في الذاكرة
      });
    }

    return data;
  } catch (error) {
    console.error('Multi-level get error:', error);
    return null;
  }
}

async function multiLevelSet(key, data, ttl = 3600) {
  try {
    // حفظ في Memory Cache
    if (memoryCache.size >= MEMORY_CACHE_SIZE) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
    
    memoryCache.set(key, {
      data,
      expiry: Date.now() + 60000 // دقيقة واحدة
    });

    // حفظ في Redis Cache
    await set(key, data, ttl);
  } catch (error) {
    console.error('Multi-level set error:', error);
  }
}

async function multiLevelDel(key) {
  try {
    memoryCache.delete(key);
    await del(key);
  } catch (error) {
    console.error('Multi-level delete error:', error);
  }
}

/**
 * Cache Warming
 * تسخين الذاكرة المؤقتة بالبيانات الأكثر استخداماً
 */
async function warmCache(keysAndFunctions, ttl = 3600) {
  const results = [];
  
  for (const { key, fetchFunction } of keysAndFunctions) {
    try {
      const data = await fetchFunction();
      if (data) {
        await set(key, data, ttl);
        results.push({ key, success: true });
      }
    } catch (error) {
      console.error(`Cache warming failed for key ${key}:`, error);
      results.push({ key, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Batch Cache Operations
 * عمليات مجمعة للذاكرة المؤقتة
 */
async function mget(keys) {
  if (!connection.isConnected) return {};
  
  try {
    const pipeline = connection.client.pipeline();
    keys.forEach(key => pipeline.get(key));
    
    const results = await pipeline.exec();
    const data = {};
    
    results.forEach((result, index) => {
      if (result[1]) {
        try {
          data[keys[index]] = JSON.parse(result[1]);
        } catch (e) {
          data[keys[index]] = result[1];
        }
      }
    });
    
    return data;
  } catch (error) {
    console.error('Batch get error:', error);
    return {};
  }
}

async function mset(keyValuePairs, ttl = 3600) {
  if (!connection.isConnected) return false;
  
  try {
    const pipeline = connection.client.pipeline();
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      pipeline.set(key, stringValue, 'EX', ttl);
    }
    
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Batch set error:', error);
    return false;
  }
}

module.exports = {
  cacheAside,
  writeThrough,
  writeBehind,
  refreshAhead,
  multiLevelGet,
  multiLevelSet,
  multiLevelDel,
  warmCache,
  mget,
  mset
};
