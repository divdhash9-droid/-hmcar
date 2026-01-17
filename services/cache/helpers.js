// [[ARABIC_HEADER]] هذا الملف (services/cache/helpers.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const connection = require('./connection');
const { set, get } = require('./basic');

const defaultTTL = 3600;

// Cache helpers for specific data types
async function cacheCars(cars, ttl = defaultTTL) {
    const cachePromises = cars.map(car => 
      set(`car:${car._id}`, car, ttl)
    );
    await Promise.all(cachePromises);
    
    // Cache the list
    await set('cars:list', cars, ttl);
}

async function getCachedCar(carId) {
    return await get(`car:${carId}`);
}

async function cacheSearchResults(query, results, ttl = 1800) { // 30 minutes
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await set(key, results, ttl);
}

async function getCachedSearchResults(query) {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await get(key);
}

async function cacheUserSession(userId, sessionData, ttl = 86400) { // 24 hours
    return await set(`session:${userId}`, sessionData, ttl);
}

async function getCachedUserSession(userId) {
    return await get(`session:${userId}`);
}

async function cacheAuctionData(auctionId, data, ttl = 1800) { // 30 minutes
    return await set(`auction:${auctionId}`, data, ttl);
}

async function getCachedAuctionData(auctionId) {
    return await get(`auction:${auctionId}`);
}

async function cacheViewCounts(itemId, counts, ttl = 3600) { // 1 hour
    return await set(`views:${itemId}`, counts, ttl);
}

async function incrementViewCount(itemId) {
    const key = `views:${itemId}`;
    const current = await get(key) || { count: 0 };
    current.count++;
    await set(key, current, 3600);
    return current.count;
}

async function cachePopularItems(items, ttl = 7200) { // 2 hours
    return await set('popular:items', items, ttl);
}

async function getCachedPopularItems() {
    return await get('popular:items');
}

async function cacheDashboardStats(stats, ttl = 600) { // 10 minutes
    return await set('dashboard:stats', stats, ttl);
}

async function getCachedDashboardStats() {
    return await get('dashboard:stats');
}

module.exports = {
    cacheCars,
    getCachedCar,
    cacheSearchResults,
    getCachedSearchResults,
    cacheUserSession,
    getCachedUserSession,
    cacheAuctionData,
    getCachedAuctionData,
    cacheViewCounts,
    incrementViewCount,
    cachePopularItems,
    getCachedPopularItems,
    cacheDashboardStats,
    getCachedDashboardStats,
};
