/**
 * [[ملف الاتصال بقاعدة البيانات]] - modules/core/database.js
 * 
 * هذا الملف مسؤول عن الاتصال بقاعدة البيانات MongoDB
 * - إدارة الاتصال
 * - معالجة الأخطاء
 * - أحداث الاتصال
 * 
 * @author HM CAR Team
 */

const mongoose = require('mongoose');
const config = require('./config');

/**
 * فئة لإدارة قاعدة البيانات
 */
class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * الاتصال بقاعدة البيانات
   */
  async connect() {
    try {
      console.log('🔄 جاري الاتصال بقاعدة البيانات...');
      
      // إعدادات الاتصال
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // الحد الأقصى للاتصالات
        serverSelectionTimeoutMS: 5000, // مهلة اختيار الخادم
        socketTimeoutMS: 45000 // مهلة الاتصال
      };

      // الاتصال
      this.connection = await mongoose.connect(config.database.uri, options);
      this.isConnected = true;

      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      console.log(`📍 عنوان قاعدة البيانات: ${config.database.uri}`);
      
      return this.connection;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      throw error;
    }
  }

  /**
   * قطع الاتصال بقاعدة البيانات
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
      }
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال:', error.message);
      throw error;
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * الحصول على حالة الاتصال
   */
  getStatus() {
    const states = {
      0: 'منقطع',
      1: 'متصل',
      2: 'جاري الاتصال',
      3: 'جاري قطع الاتصال'
    };
    
    return {
      state: states[mongoose.connection.readyState],
      isConnected: this.isConnected,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// إنشاء نسخة واحدة من مدير قاعدة البيانات
const databaseManager = new DatabaseManager();

// أحداث قاعدة البيانات
mongoose.connection.on('connected', () => {
  console.log('📊 قاعدة البيانات متصلة');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ خطأ في قاعدة البيانات:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 قاعدة البيانات منقطعة');
});

// عند إغلاق التطبيق
process.on('SIGINT', async () => {
  await databaseManager.disconnect();
  process.exit(0);
});

module.exports = databaseManager;
