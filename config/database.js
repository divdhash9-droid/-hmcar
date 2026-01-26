// [[ARABIC_HEADER]] هذا الملف (config/database.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * config/database.js
 * تهيئة قاعدة بيانات MongoDB Atlas
 * 
 * الوصف:
 * - هذا الملف يهتم بتهيئة الاتصال بقاعدة بيانات MongoDB Atlas
 * - يتضمن إعدادات الاتصال ووظائف إدارة الاتصال
 */

const mongoose = require('mongoose');

// تهيئة الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    // تحديد نوع البيئة
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL || process.env.NOW_REGION;
    
    // تحديد URI بناءً على البيئة
    let mongoUri;
    if (isProduction || isVercel) {
      // في بيئة الإنتاج أو Vercel نستخدم Atlas
      mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MONGO_URI is required in production environment');
      }
      console.log('🌍 Production mode: Using MongoDB Atlas');
    } else {
      // في بيئة التطوير نستخدم URI من .env
      mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction';
      console.log('🏠 Development mode: Using', mongoUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB');
    }
    
    // في بيئة Vercel، نضمن استخدام Atlas حتى في حالة وجود LOCAL_URI
    if (isVercel && process.env.MONGODB_URI) {
      mongoUri = process.env.MONGODB_URI; // Vercel sometimes uses this variable name
      console.log('☁️ Vercel environment detected: Using MONGODB_URI');
    }
    
    // خيارات الاتصال الموصى بها من MongoDB
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for faster failover
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    
    // Return success indicator
    return { success: true, type: 'atlas', connection: conn, uriUsed: mongoUri };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL || process.env.NOW_REGION;
    
    // في بيئة الإنتاج أو Vercel لا نستخدم قاعدة بيانات محلية
    if (isProduction || isVercel) {
      console.error('💥 Production environment: Cannot use local database fallback');
      console.error('Ensure your MONGO_URI environment variable is set correctly in production');
      const err = new Error(`Database connection failed in production: ${error.message}`);
      err.cause = error;
      throw err;
    }
    
    // محاولة الاتصال بقاعدة بيانات محلية كاحتياطي
    console.log('🔄 Falling back to local database...');
    try {
      const { createLocalDB, mockMongoOperations } = require('./local-database');
      const localDB = await createLocalDB();
      if (localDB) {
        console.log('✅ Local database ready for development');
        const mockOps = mockMongoOperations(localDB.db);
        return {
          success: true,
          type: 'local',
          connection: localDB,
          operations: mockOps
        };
      }
    } catch (localError) {
      console.error('❌ Local database also failed:', localError.message);
    }
    
    // إنهاء العملية في حالة فشل كلا الاتصالين
    console.error('💥 Both Atlas and local database connections failed');
    const err = new Error('Both Atlas and local database connections failed');
    err.cause = error;
    throw err;
  }
};

// دالة للحصول على حالة الاتصال
const getConnectionStatus = () => {
  return mongoose.connection.readyState;
};

// خرائط حالة الاتصال
const connectionStates = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting'
};

module.exports = { 
  connectDB, 
  getConnectionStatus, 
  connectionStates 
};