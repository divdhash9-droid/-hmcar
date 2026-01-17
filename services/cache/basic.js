// [[ARABIC_HEADER]] هذا الملف (services/cache/basic.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const connection = require('./connection');

const defaultTTL = 3600; // 1 hour

async function set(key, value, ttl = defaultTTL) {
  if (!connection.isConnected) return false;
  
  try {
    const serializedValue = JSON.stringify(value);
    await connection.client.setEx(key, ttl, serializedValue);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

async function get(key) {
  if (!connection.isConnected) return null;
  
  try {
    const value = await connection.client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

async function del(key) {
  if (!connection.isConnected) return false;
  
  try {
    await connection.client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

async function exists(key) {
  if (!connection.isConnected) return false;
  
  try {
    const result = await connection.client.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}

async function flush() {
  if (!connection.isConnected) return false;
  
  try {
    await connection.client.flushDb();
    return true;
  } catch (error) {
    console.error('Cache flush error:', error);
    return false;
  }
}

async function increment(key, amount = 1) {
    if (!connection.isConnected) return null;
    
    try {
      return await connection.client.incrBy(key, amount);
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }

async function decrement(key, amount = 1) {
    if (!connection.isConnected) return null;
    
    try {
      return await connection.client.decrBy(key, amount);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return null;
    }
}

module.exports = {
  set,
  get,
  del,
  exists,
  flush,
  increment,
  decrement,
  defaultTTL,
};
