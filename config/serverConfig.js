// [[ARABIC_HEADER]] هذا الملف (config/serverConfig.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// إعدادات الخادم الموحدة
// تضمن سلوك موحد في جميع البيئات

const assetHelper = require('../helpers/assetHelper');

class ServerConfig {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isVercel = !!process.env.VERCEL;
    
    // إعدادات المنافذ
    this.port = process.env.PORT || (this.isVercel ? undefined : 4000);
    
    // إعدادات قاعدة البيانات
    this.database = {
      uri: this.getDatabaseUri(),
      options: {
        serverSelectionTimeoutMS: 10000,
        bufferCommands: false,
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
      }
    };
    
    // إعدادات الأمان
    this.security = {
      helmet: this.getHelmetConfig(),
      cors: this.getCorsConfig(),
      rateLimit: this.getRateLimitConfig()
    };
    
    // إعدادات التخزين المؤقت
    this.cache = assetHelper.getCacheSettings();
    
    // إعدادات الجلسات
    this.session = this.getSessionConfig();
  }

  /**
   * الحصول على URI قاعدة البيانات المناسب
   */
  getDatabaseUri() {
    // في بيئة الإنتاج أو Vercel نستخدم Atlas إجبارياً
    if (this.isProduction || this.isVercel) {
      // Vercel sometimes uses MONGODB_URI
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
      // Do not throw at module-import time in serverless environments.
      // We'll validate later and surface an error response instead of crashing the function.
      return uri;
    }
    
    // في التطوير نستخدم URI من .env أو قاعدة بيانات محلية
    return process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction';
  }

  /**
   * إعدادات Helmet للأمان
   */
  getHelmetConfig() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        },
      },
      crossOriginEmbedderPolicy: false, // مهم للـ Vercel
      crossOriginResourcePolicy: { policy: "cross-origin" }
    };
  }

  /**
   * إعدادات CORS
   */
  getCorsConfig() {
    return {
      origin: this.isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
      optionsSuccessStatus: 200
    };
  }

  /**
   * إعدادات حد الطلبات
   */
  getRateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 دقيقة
      max: this.isDevelopment ? 1000 : 100, // أكثر في التطوير
      message: 'عدد الطلبات كثير جداً، حاول لاحقاً',
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => this.isDevelopment // تخطي في التطوير
    };
  }

  /**
   * إعدادات الجلسات
   */
  getSessionConfig() {
    const mongoUri = this.database.uri;
    
    return {
      secret: process.env.SESSION_SECRET || 'hm_car_auction_luxury_secret_2024',
      resave: false,
      saveUninitialized: false,
      proxy: this.isVercel,
      cookie: {
        httpOnly: true,
        secure: this.isProduction ? (this.isVercel ? 'auto' : true) : false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 ساعة
      },
      ...(mongoUri ? { 
        store: require('connect-mongo').create({ mongoUrl: mongoUri })
      } : {})
    };
  }

  /**
   * إعدادات التخزين المؤقت للملفات الثابتة
   */
  getStaticFileConfig() {
    return {
      maxAge: this.cache.maxAge,
      etag: this.cache.etag,
      lastModified: this.cache.lastModified,
      immutable: this.cache.immutable,
      fallthrough: false // مهم لتجنب الأخطاء 404
    };
  }

  /**
   * إعدادات تسجيل الدخول
   */
  getLoggerConfig() {
    return {
      format: this.isDevelopment ? 'dev' : 'combined',
      skip: (req, res) => {
        // تخطي تسجيل بعض الطلبات في الإنتاج
        if (this.isProduction) {
          const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
          return skipPaths.some(path => req.path.includes(path));
        }
        return false;
      }
    };
  }

  /**
   * التحقق من صحة الإعدادات
   */
  validate() {
    const errors = [];
    
    // التحقق من متطلبات الإنتاج
    if (this.isProduction && !process.env.MONGO_URI) {
      errors.push('MONGO_URI مطلوب في بيئة الإنتاج');
    }
    
    if (this.isProduction && !process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET مطلوب في بيئة الإنتاج');
    }
    
    // التحقق من المنافذ
    if (!this.isVercel && (!this.port || this.port < 1 || this.port > 65535)) {
      errors.push('منفذ غير صالح');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * الحصول على معلومات البيئة
   */
  getEnvironmentInfo() {
    return {
      environment: process.env.NODE_ENV || 'development',
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isVercel: this.isVercel,
      port: this.port,
      databaseUri: this.database.uri
        ? this.database.uri.replace(/\/\/.+@/, '//****:****@')
        : '(not set)',
      nodeVersion: process.version
    };
  }
}

// تصدير نسخة واحدة
module.exports = new ServerConfig();