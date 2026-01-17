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
    // استخدام متغير البيئة MONGO_URI للاتصال بـ MongoDB Atlas
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction';
    
    // خيارات الاتصال الموصى بها من MongoDB
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    
    // إعداد أحداث الاتصال
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB connection disconnected');
    });

    // التعامل مع إغلاق العملية
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1); // إنهاء العملية في حالة فشل الاتصال
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