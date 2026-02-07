/**
 * [[ملف التطبيق الرئيسي]] - modules/app.js
 * 
 * هذا الملف هو نقطة بداية التطبيق المنظم
 * - إعداد Express
 * - تحميل الوسطاء
 * - تحميل المسارات
 * - معالجة الأخطاء
 * 
 * @author HM CAR Team
 */

const express = require('express');
const path = require('path');
const config = require('./core/config');
const database = require('./core/database');
const logger = require('./core/logger');

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
    // الوسطاء الأساسية
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // إعدادات الأمان
    this.setupSecurity();
    
    // إعدادات الجلسات
    this.setupSessions();
    
    // الملفات الثابتة
    this.setupStaticFiles();
    
    // محرك القوالب
    this.setupViewEngine();
    
    // الوسطاء المخصصة
    this.setupCustomMiddleware();
  }

  /**
   * إعداد الأمان
   */
  setupSecurity() {
    const helmet = require('helmet');
    const cors = require('cors');
    
    // Helmet
    this.app.use(helmet(config.security.helmet));
    
    // CORS
    this.app.use(cors(config.security.cors));
    
    // Rate Limiting
    const rateLimit = require('express-rate-limit');
    this.app.use(rateLimit(config.security.rateLimit));
    
    logger.info('تم إعداد إعدادات الأمان');
  }

  /**
   * إعداد الجلسات
   */
  setupSessions() {
    const session = require('express-session');
    const flash = require('connect-flash');
    
    // الجلسات
    this.app.use(session(config.server.session));
    
    // Flash Messages
    this.app.use(flash());
    
    // تمرير الرسائل لجميع القوالب
    this.app.use((req, res, next) => {
      res.locals.flash = req.session.flash || null;
      res.locals.csrfToken = req.session.csrfToken || '';
      next();
    });
    
    logger.info('تم إعداد الجلسات والرسائل');
  }

  /**
   * إعداد الملفات الثابتة
   */
  setupStaticFiles() {
    const staticConfig = config.server.static;
    
    this.app.use('/public', express.static(path.join(__dirname, '..', 'public'), staticConfig));
    this.app.use('/css', express.static(path.join(__dirname, '..', 'public/css'), staticConfig));
    this.app.use('/js', express.static(path.join(__dirname, '..', 'public/js'), staticConfig));
    this.app.use('/images', express.static(path.join(__dirname, '..', 'public/images'), staticConfig));
    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
      ...staticConfig,
      maxAge: '7d'
    }));
    
    // PWA Assets
    this.app.get('/manifest.json', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'public', 'manifest.json'));
    });
    
    this.app.get('/sw.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.sendFile(path.join(__dirname, '..', 'public', 'sw.js'));
    });
    
    this.app.get('/favicon.ico', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'public', 'images', 'favicon.ico'));
    });
    
    logger.info('تم إعداد الملفات الثابتة');
  }

  /**
   * إعداد محرك القوالب
   */
  setupViewEngine() {
    const ejs = require('ejs');
    
    // إعدادات EJS
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '..', 'views'));
    
    // CSRF Protection
    this.app.use((req, res, next) => {
      if (!req.session.csrfToken) {
        req.session.csrfToken = require('./utils/helpers').generateCSRFToken();
      }
      next();
    });
    
    logger.info('تم إعداد محرك القوالب');
  }

  /**
   * إعداد الوسطاء المخصصة
   */
  setupCustomMiddleware() {
    const { requireDeviceAuth, logApiRequest } = require('./auth/middleware');
    
    // تسجيل طلبات API
    this.app.use('/api', logApiRequest);
    
    // معلومات الجهاز
    this.app.use(requireDeviceAuth);
    
    // متغيرات عامة للقوالب
    this.app.use((req, res, next) => {
      res.locals.currentUser = req.session.user || null;
      res.locals.bodyClass = '';
      res.locals.hideNavbar = false;
      res.locals.hideFooter = false;
      res.locals.fullWidth = false;
      next();
    });
    
    logger.info('تم إعداد الوسطاء المخصصة');
  }

  /**
   * إعداد المسارات
   */
  setupRoutes() {
    // الصفحة الرئيسية
    this.app.get('/', (req, res) => {
      res.render('ultimate-home', {
        title: 'HM CAR - منصة مزادات السيارات',
        bodyClass: 'home-page'
      });
    });

    // مسارات المصادقة
    this.setupAuthRoutes();
    
    // مسارات الأدمن
    this.setupAdminRoutes();
    
    // مسارات العملاء
    this.setupClientRoutes();
    
    // مسارات API
    this.setupApiRoutes();
    
    // مسارات إضافية
    this.setupAdditionalRoutes();
    
    logger.info('تم إعداد المسارات');
  }

  /**
   * إعداد مسارات المصادقة
   */
  setupAuthRoutes() {
    const authRoutes = require('../routes/auth');
    this.app.use('/auth', authRoutes);
  }

  /**
   * إعداد مسارات الأدمن
   */
  setupAdminRoutes() {
    const adminRoutes = require('../routes/admin');
    const clientRoutes = require('../routes/admin-clients');
    
    this.app.use('/admin', adminRoutes);
    this.app.use('/admin/clients', clientRoutes);
  }

  /**
   * إعداد مسارات العملاء
   */
  setupClientRoutes() {
    const clientRoutes = require('../routes/cars');
    this.app.use('/cars', clientRoutes);
  }

  /**
   * إعداد مسارات API
   */
  setupApiRoutes() {
    try {
      const analyticsRoutes = require('../routes/api/analytics');
      const notificationsRoutes = require('../routes/api/notifications');
      
      this.app.use('/api/analytics', analyticsRoutes);
      this.app.use('/api/notifications', notificationsRoutes);
    } catch (error) {
      logger.warn('بعض مسارات API غير موجودة، سيتم تخطيها');
    }
  }

  /**
   * إعداد المسارات الإضافية
   */
  setupAdditionalRoutes() {
    // صفحة من نحن
    this.app.get('/about', (req, res) => {
      res.render('about', {
        title: 'من نحن - HM CAR'
      });
    });

    // صفحة الاتصال
    this.app.get('/contact', (req, res) => {
      res.render('contact', {
        title: 'اتصل بنا - HM CAR'
      });
    });

    // لوحة تحكم العميل
    this.app.get('/client/dashboard', (req, res) => {
      if (!req.session.user) {
        req.session.returnTo = '/client/dashboard';
        return res.redirect('/auth/login');
      }
      
      if (req.session.user.role === 'buyer') {
        return res.redirect('/cars');
      }
      
      res.render('client/dashboard', {
        title: 'لوحة التحكم - HM CAR'
      });
    });
  }

  /**
   * إعداد معالجة الأخطاء
   */
  setupErrorHandling() {
    // معالج 404
    this.app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'المورد غير موجود' });
      }
      
      res.status(404).render('errors/404', { 
        layout: 'layout',
        title: 'صفحة غير موجودة - HM CAR'
      });
    });

    // معالج الأخطاء العامة
    this.app.use((err, req, res, next) => {
      logger.error('خطأ غير معالج', err);
      
      // خطأ CSRF
      if (err && err.code === 'EBADCSRFTOKEN') {
        const wantsJson = req.path.startsWith('/api');
        
        if (wantsJson) {
          return res.status(403).json({ error: 'رمز CSRF غير صالح' });
        }
        
        req.flash('error', 'انتهت صلاحية الجلسة أو رمز الحماية غير صحيح');
        return res.redirect('/auth/login');
      }
      
      // خطأ API
      if (req.path.startsWith('/api')) {
        return res.status(500).json({ error: 'حدث خطأ في الخادم' });
      }
      
      // خطأ صفحة
      res.status(500).render('errors/500', { 
        layout: 'layout',
        title: 'خطأ في الخادم - HM CAR',
        error: err
      });
    });
    
    logger.info('تم إعداد معالجة الأخطاء');
  }

  /**
   * بدء التطبيق
   */
  async start() {
    try {
      // الاتصال بقاعدة البيانات
      await database.connect();
      
      // بدء الخادم
      const server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 الخادم يعمل على ${config.server.host}:${config.server.port}`);
        logger.info(`🌐 رابط الوصول: ${config.server.baseUrl}`);
        logger.info(`📊 البيئة: ${config.server.env}`);
      });

      // معالجة إغلاق التطبيق
      process.on('SIGTERM', () => this.shutdown(server));
      process.on('SIGINT', () => this.shutdown(server));
      
      return server;
    } catch (error) {
      logger.error('فشل في بدء التطبيق', error);
      process.exit(1);
    }
  }

  /**
   * إيقاف التطبيق
   */
  async shutdown(server) {
    logger.info('جاري إيقاف التطبيق...');
    
    try {
      // إغلاق الخادم
      server.close(() => {
        logger.info('تم إغلاق الخادم');
      });
      
      // قطع الاتصال بقاعدة البيانات
      await database.disconnect();
      
      logger.info('تم إيقاف التطبيق بنجاح');
      process.exit(0);
    } catch (error) {
      logger.error('خطأ في إيقاف التطبيق', error);
      process.exit(1);
    }
  }

  /**
   * الحصول على تطبيق Express
   */
  getApp() {
    return this.app;
  }
}

module.exports = App;
