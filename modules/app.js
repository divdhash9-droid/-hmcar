// [[ARABIC_HEADER]] هذا الملف (modules/app.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * @file modules/app.js
 * @description المكون الأساسي لتطبيق Express. 
 * هذا الملف مسؤول عن تجميع الإعدادات، المسارات، طبقات الحماية، وربط قاعدة البيانات.
 */

const express = require('express');
const path = require('path');
const config = require('./core/config');
const database = require('./core/database');
const logger = require('./core/logger');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

/**
 * فئة التطبيق (App Class)
 * تقوم بتنظيم دورة حياة الخادم وتجهيز البيئة البرمجية.
 */
class App {
  constructor() {
    this.app = express();
    this.setupApp();
  }

  /**
   * الإعداد الأولي للتطبيق
   */
  setupApp() {
    this.setupMiddleware();      // إعداد الوسطاء (Middlewares)
    this.setupRoutes();          // إعداد المسارات (Routes)
    this.setupErrorHandling();    // إعداد معالجة الأخطاء
  }

  /**
   * إعداد طبقات الحماية والوسطاء
   */
  setupMiddleware() {
    // استخدام Helmet لتأمين ترويسات HTTP
    this.app.use(helmet(config.security.helmet));

    // تفعيل ضغط البيانات لتحسين سرعة التحميل
    this.app.use(compression());

    // تفعيل سياسة مشاركة الموارد (CORS)
    this.app.use(cors(config.security.cors));

    // تحليل بيانات الطلبات بصيغة JSON و URL-encoded
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // تقديم الملفات الثابتة (الصور والوسائط المرفوعة)
    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    this.app.use('/public', express.static(path.join(__dirname, '..', 'public')));

    logger.info('✅ تم إعداد الوسطاء وطبقات الأمان بنجاح');
  }

  /**
   * تعريف المسارات الرئيسية للنظام
   */
  setupRoutes() {
    // نقطة فحص حالة الخادم (Health Check)
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date(), engine: 'HM-CAR-V2' });
    });

    // تحميل إصدار الـ API الثاني (V2)
    this.setupApiRoutes();

    // رسالة الترحيب واختبار الاتصال بالجذر
    this.app.get('/', (req, res) => {
      res.json({
        message: 'مرحباً بك في واجهة برمجة تطبيقات HM CAR V2',
        status: 'Online',
        documentation: '/api/v2/docs'
      });
    });

    logger.info('✅ تم إعداد المسارات الأساسية');
  }

  /**
   * تحميل مسارات الـ API المنظمة
   */
  setupApiRoutes() {
    try {
      // استيراد الموجه الرئيسي لنسخة API v2
      const apiV2Router = require('../routes/api/v2/index');
      this.app.use('/api/v2', apiV2Router);

      logger.info('✅ تم تحميل جميع مسارات API v2 بنجاح');
    } catch (error) {
      logger.error('❌ خطأ في تحميل مسارات API v2:', error.message);
      console.error(error);
    }
  }

  /**
   * نظام معالجة الأخطاء الشامل
   */
  setupErrorHandling() {
    // معالجة الروابط غير الموجودة (404)
    this.app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: 'عذراً، المسار المطلوب غير موجود',
        code: 'NOT_FOUND'
      });
    });

    // المعالج العام للأخطاء البرمجية والتقنية
    this.app.use((err, req, res, next) => {
      logger.error('⚠️ خطأ غير متوقع:', err);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ تقني داخلي في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    logger.info('✅ تم تفعيل نظام معالجة الأخطاء');
  }

  /**
   * تشغيل الخادم وربط قاعدة البيانات
   */
  async start() {
    try {
      // الاتصال بقاعدة بيانات MongoDB
      await database.connect();
      logger.info('✅ تم الاتصال بقاعدة البيانات بنجاح');

      const socketModule = require('./socket');

      // بدء الاستماع للطلبات عبر البورت المحدد
      const server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 الخادم يعمل حالياً على http://${config.server.host}:${config.server.port}`);
      });

      // تهيئة نظام الـ WebSockets للتواصل الفوري (للمزادات والتنبيهات)
      this.io = socketModule.init(server);
      this.app.set('io', this.io); // جعل كائن IO متاحاً في كامل التطبيق

      // آلية الإغلاق الآمن للنظام (Graceful Shutdown)
      const shutdown = async () => {
        logger.info('⏳ جاري إغلاق النظام بأمان...');
        server.close(() => {
          logger.info('🛑 تم إيقاف استقبال الطلبات');
        });
        await database.disconnect();
        process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

    } catch (error) {
      logger.error('❌ فشل تشغيل التطبيق:', error);
      process.exit(1);
    }
  }
}

module.exports = App;
