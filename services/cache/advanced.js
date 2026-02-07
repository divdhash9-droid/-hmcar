// [[ARABIC_HEADER]] هذا الملف (services/cache/advanced.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const connection = require('./connection');
const { set, get, increment } = require('./basic');

async function setWithTags(key, value, tags = [], ttl = 3600) {
    if (!connection.isConnected) return false;
    
    try {
      // Set the main value
      await set(key, value, ttl);
      
      // Add tags for easy invalidation
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await connection.client.sAdd(tagKey, key);
        await connection.client.expire(tagKey, ttl);
      }
      
      return true;
    } catch (error) {
      console.error('Cache set with tags error:', error);
      return false;
    }
}

async function invalidateByTag(tag) {
    if (!connection.isConnected) return false;
    
    try {
      const tagKey = `tag:${tag}`;
      const keys = await connection.client.sMembers(tagKey);
      
      if (keys.length > 0) {
        await connection.client.del(keys);
        await connection.client.del(tagKey);
      }
      
      return true;
    } catch (error) {
      console.error('Cache invalidate by tag error:', error);
      return false;
    }
}

async function checkRateLimit(identifier, limit = 100, window = 3600) { // 100 requests per hour
    const key = `ratelimit:${identifier}`;
    const current = await increment(key);
    
    if (current === 1) {
      await connection.client.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: await connection.client.ttl(key)
    };
}

module.exports = {
    setWithTags,
    invalidateByTag,
    checkRateLimit,
};
