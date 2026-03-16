// [[ARABIC_HEADER]] هذا الملف (config/serverConfig.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// إعدادات الخادم الموحدة
// تضمن سلوك موحد في جميع البيئات

const assetHelper = require('../helpers/assetHelper');

function isValidMongoUri(uri) {
  return typeof uri === 'string' && /^mongodb(\+srv)?:\/\//i.test(uri.trim());
}

function isOfflineUri(uri) {
  if (typeof uri !== 'string') return false;
  const v = uri.trim().toLowerCase();
  return v.startsWith('memory://') || v.startsWith('offline://') || v === 'localdb' || v === 'local-db';
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

class ServerConfig {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isVercel = !!process.env.VERCEL;
    
    // إعدادات المنافذ
    // Default local port is 4001 (matches docs, docker, swagger, and VS Code tasks)
    this.port = process.env.PORT || (this.isVercel ? undefined : 4001);
    
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
    const envUri = process.env.MONGO_URI;
    const fallback = 'mongodb://127.0.0.1:27017/car-auction';

    // Explicit offline mode: do not attempt MongoDB connection
    if (envUri && isOfflineUri(envUri)) {
      return undefined;
    }

    if (envUri && !isValidMongoUri(envUri)) {
      console.warn('⚠️ Invalid MONGO_URI scheme in .env; falling back to local MongoDB URI');
      return fallback;
    }
    return envUri || fallback;
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
   * [[ARABIC_COMMENT]] يضمن السماح بالاتصال من الواجهة الأمامية فقط مع دعم Vercel تلقائياً
   */
  getCorsConfig() {
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    
    // إضافة النطاقات المعروفة للنظام تلقائياً
    if (process.env.CLIENT_URL) allowed.push(process.env.CLIENT_URL.trim());
    if (process.env.BASE_URL) allowed.push(process.env.BASE_URL.trim());
    if (process.env.NEXT_PUBLIC_API_URL) allowed.push(process.env.NEXT_PUBLIC_API_URL.split('/api')[0]);

    return {
      origin: this.isDevelopment ? '*' : (allowed.length > 0 ? allowed : true),
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
    const useMongoSessionStore = this.isProduction || parseBool(process.env.USE_MONGO_SESSION_STORE, false);
    
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
      ...(useMongoSessionStore && isValidMongoUri(mongoUri) ? {
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
    
    const requiredProduVars = [
      'MONGO_URI',
      'SESSION_SECRET',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    if (this.isProduction || this.isVercel) {
      requiredProduVars.forEach(v => {
        if (!process.env[v]) errors.push(`المتغير ${v} مفقود ومطلوب للإنتاج`);
      });
    }

    if (this.isProduction && process.env.MONGO_URI && !isValidMongoUri(process.env.MONGO_URI)) {
      errors.push('MONGO_URI غير صالح (يجب أن يبدأ بـ mongodb:// أو mongodb+srv://)');
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