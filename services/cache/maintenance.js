// [[ARABIC_HEADER]] هذا الملف (services/cache/maintenance.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const connection = require('./connection');
const { set, get, defaultTTL } = require('./basic');
const helpers = require('./helpers');

async function warmCache() {
    console.log('Cache warming is currently disabled for debugging. Skipping.');
    return;
    try {
      console.log('Starting cache warming...');
      
      // Cache popular cars
      const Car = require('../../models/Car');
      const popularCars = await Car.find({ available: true })
        .sort({ views: -1 })
        .limit(20)
        .populate('brand');
      
      await helpers.cacheCars(popularCars);
      
      // Cache search suggestions
      const Brand = require('../../models/Brand');
      const brands = await Brand.find().sort('name');
      await set('brands:list', brands, 7200);
      
      // Cache dashboard stats
      const stats = await getDashboardStats();
      await helpers.cacheDashboardStats(stats);
      
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
}

async function getDashboardStats() {
    const Car = require('../../models/Car');
    const User = require('../../models/User');
    const Order = require('../../models/Order');
    const Auction = require('../../models/Auction');
    
    const [carCount, userCount, orderCount, auctionCount] = await Promise.all([
      Car.countDocuments({ available: true }),
      User.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Auction.countDocuments({ status: 'active' })
    ]);
    
    return {
      cars: carCount,
      users: userCount,
      orders: orderCount,
      auctions: auctionCount
    };
}

async function cleanup() {
    if (!connection.isConnected) return;
    
    try {
      console.log('Starting cache cleanup...');
      
      const keys = await connection.client.keys('*');
      let expiredCount = 0;
      
      for (const key of keys) {
        const ttl = await connection.client.ttl(key);
        if (ttl === -1) { // No expiration set
          await connection.client.expire(key, defaultTTL);
          expiredCount++;
        }
      }
      
      console.log(`Cache cleanup completed. Updated ${expiredCount} keys.`);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
}

async function healthCheck() {
    if (!connection.isConnected) {
      return { status: 'disconnected', message: 'Redis client not connected' };
    }
    
    try {
      const pong = await connection.client.ping();
      const info = await connection.client.info('memory');
      
      return {
        status: 'connected',
        ping: pong,
        memory: parseMemoryInfo(info)
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
}

function parseMemoryInfo(info) {
    const lines = info.split('\r\n');
    const memoryData = {};
    
    for (const line of lines) {
      if (line.startsWith('used_memory_human:')) {
        memoryData.used = line.split(':')[1];
      } else if (line.startsWith('maxmemory_human:')) {
        memoryData.max = line.split(':')[1];
      }
    }
    
    return memoryData;
}

module.exports = {
    warmCache,
    getDashboardStats,
    cleanup,
    healthCheck,
};
