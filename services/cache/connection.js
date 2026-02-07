// [[ARABIC_HEADER]] هذا الملف (services/cache/connection.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const redis = require('redis');

class CacheConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Skip Redis connection entirely - run without cache
      console.log('⚠️ Redis disabled - running without cache');
      this.isConnected = false;
    } catch (error) {
      console.error('Failed to connect to Redis, running without cache:', error.message);
      this.isConnected = false;
      // Don't throw error, just run without cache
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis client disconnected');
    }
  }
}

module.exports = new CacheConnection();
