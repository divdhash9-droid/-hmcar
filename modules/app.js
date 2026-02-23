/**
 * [[ملف التطبيق الرئيسي]] - modules/app.js
 * 
 * هذا الملف هو نقطة بداية التطبيق المنظم (Backend API Server)
 * - إعداد Express
 * - تحميل الوسطاء
 * - تحميل مسارات API v2
 * - معالجة الأخطاء
 * 
 * @author HM CAR Team
 */

const express = require('express');
const path = require('path');
const config = require('./core/config');
const database = require('./core/database');
const logger = require('./core/logger');
const cors = require('cors');
const helmet = require('helmet');

/**
 * فئة التطبيق
 */
class App {
  constructor() {
    this.app = express();
    this.setupApp();
  }

  /**
   * إعداد التطبيق
   */
  setupApp() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * إعداد الوسطاء
   */
  setupMiddleware() {
    // إعدادات الأمان الأساسية
    this.app.use(helmet(config.security.helmet));
    this.app.use(cors(config.security.cors));

    // تحليل البيانات
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // الملفات الثابتة (للملفات المرفوعة فقط)
    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    this.app.use('/public', express.static(path.join(__dirname, '..', 'public')));

    logger.info('تم إعداد الوسطاء والأمان');
  }

  /**
   * إعداد المسارات
   */
  setupRoutes() {
    // نقطة فحص الصحة
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    // تحميل مسارات API v2
    this.setupApiRoutes();

    // توجيه الصفحة الرئيسية للجذر (يمكن إزالتها إذا كان الـ Frontend منفصل تماماً)
    this.app.get('/', (req, res) => {
      res.json({ message: 'HM CAR API v2 Running', docs: '/api/v2/docs' });
    });

    logger.info('تم إعداد المسارات');
  }

  /**
   * إعداد مسارات API
   */
  setupApiRoutes() {
    try {
      // مسارات API v2 Only
      const authRoutes = require('../routes/api/v2/auth');
      const carsRoutes = require('../routes/api/v2/cars');
      const auctionsRoutes = require('../routes/api/v2/auctions');
      const ordersRoutes = require('../routes/api/v2/orders');
      const dashboardRoutes = require('../routes/api/v2/dashboard');
      const analyticsV2Routes = require('../routes/api/v2/analytics');
      const partsRoutes = require('../routes/api/v2/parts');
      const settingsRoutes = require('../routes/api/v2/settings');
      const usersRoutes = require('../routes/api/v2/users');
      const favoritesRoutes = require('../routes/api/v2/favorites');
      const bidsRoutes = require('../routes/api/v2/bids');
      const reviewsRoutes = require('../routes/api/v2/reviews');
      const messagesRoutes = require('../routes/api/v2/messages');
      const comparisonsRoutes = require('../routes/api/v2/comparisons');
      const contactRoutes = require('../routes/api/v2/contact');
      const brandsRoutes = require('../routes/api/v2/brands');
      const uploadRoutes = require('../routes/api/v2/upload');
      const notificationsRoutes = require('../routes/api/v2/notifications');

      this.app.use('/api/v2/auth', authRoutes);
      this.app.use('/api/v2/cars', carsRoutes);
      this.app.use('/api/v2/auctions', auctionsRoutes);
      this.app.use('/api/v2/orders', ordersRoutes);
      this.app.use('/api/v2/dashboard', dashboardRoutes);
      this.app.use('/api/v2/analytics', analyticsV2Routes);
      this.app.use('/api/v2/parts', partsRoutes);
      this.app.use('/api/v2/settings', settingsRoutes);
      this.app.use('/api/v2/users', usersRoutes);
      this.app.use('/api/v2/favorites', favoritesRoutes);
      this.app.use('/api/v2/bids', bidsRoutes);
      this.app.use('/api/v2/reviews', reviewsRoutes);
      this.app.use('/api/v2/messages', messagesRoutes);
      this.app.use('/api/v2/comparisons', comparisonsRoutes);
      this.app.use('/api/v2/contact', contactRoutes);
      this.app.use('/api/v2/brands', brandsRoutes);
      this.app.use('/api/v2/upload', uploadRoutes);
      this.app.use('/api/v2/notifications', notificationsRoutes);

      logger.info('تم تحميل مسارات API v2 بنجاح');
    } catch (error) {
      logger.error('خطأ في تحميل مسارات API v2:', error.message);
      console.error(error);
    }
  }

  /**
   * إعداد معالجة الأخطاء
   */
  setupErrorHandling() {
    // 404 Handler
    this.app.use((req, res, next) => {
      res.status(404).json({ success: false, message: 'المسار غير موجود', code: 'NOT_FOUND' });
    });

    // General Error Handler
    this.app.use((err, req, res, next) => {
      logger.error('خطأ غير معالج:', err);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    logger.info('تم إعداد معالجة الأخطاء');
  }

  /**
   * بدء التطبيق
   */
  async start() {
    try {
      await database.connect();

      const socketModule = require('./socket');
      const server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 الخادم يعمل على ${config.server.host}:${config.server.port}`);
        logger.info(`🌐 API رابط: http://localhost:${config.server.port}/api/v2`);
      });

      // تهيئة Sockets
      this.io = socketModule.init(server);
      this.app.set('io', this.io); // جعلها متاحة في المسارات إذا لزم الأمر

      // Graceful Shutdown
      const shutdown = async () => {
        logger.info('جاري إيقاف الخادم...');
        server.close(() => logger.info('تم إغلاق الخادم'));
        await database.disconnect();
        process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

    } catch (error) {
      logger.error('فشل في بدء التطبيق', error);
      process.exit(1);
    }
  }
}

module.exports = App;
