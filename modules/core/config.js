// [[ARABIC_HEADER]] هذا الملف (modules/core/config.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[ملف الإعدادات الأساسية]] - modules/core/config.js
 * 
 * هذا الملف يحتوي على جميع الإعدادات الأساسية للمشروع
 * - إعدادات قاعدة البيانات
 * - إعدادات الخادم
 * - إعدادات الأمان
 * - إعدادات البيئة
 * 
 * @author HM CAR Team
 * @version 2.0.0
 */

const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// تحميل متغيرات البيئة
dotenv.config();

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const isMochaRun = process.argv.some((arg) => String(arg).toLowerCase().includes('mocha'));
const forceMemoryDb = (isTestEnv || isMochaRun) && process.env.TEST_USE_REMOTE_DB !== 'true';
const defaultMongoUri = forceMemoryDb
  ? 'memory://car-auction'
  : 'mongodb://127.0.0.1:27017/car-auction';

function resolveSecret(envName) {
  const value = process.env[envName];
  if (value) return value;

  if (isProduction) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  // Generate a per-run secret in development to avoid shipping static defaults.
  return crypto.randomBytes(64).toString('hex');
}

const sessionSecret = resolveSecret('SESSION_SECRET');
const jwtSecret = resolveSecret('JWT_SECRET');

/**
 * إعدادات قاعدة البيانات
 */
const database = {
  // نوع قاعدة البيانات
  type: 'mongodb',

  // معلومات الاتصال
  uri: forceMemoryDb
    ? defaultMongoUri
    : (process.env.MONGO_URI || process.env.MONGODB_URI || defaultMongoUri),

  // خيارات الاتصال
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50, // [[ARABIC_COMMENT]] رفع الحد الأقصى للاتصالات لدعم المزيد من المستخدمين المتزامنين
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false
  }
};

/**
 * إعدادات الخادم
 */
const server = {
  // معلومات أساسية
  port: process.env.PORT || 4002,
  host: process.env.HOST || 'localhost',

  // بيئة التشغيل
  env: process.env.NODE_ENV || 'development',

  // عنوان URL الأساسي
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 4002}`,

  // إعدادات الجلسات
  session: {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 ساعة
    }
  },

  // إعدادات الملفات الثابتة
  static: {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true
  }
};

/**
 * إعدادات الأمان
 */
const security = {
  // مفتاح JWT
  jwtSecret,

  // إعدادات CORS
  cors: {
    origin: function (origin, callback) {
      // السماح بالطلبات بدون origin (مثل curl وPostman والسيرفر-إلى-سيرفر)
      if (!origin) return callback(null, true);

      const allowedInDev = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4002'
      ];

      // في بيئة التطوير
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, allowedInDev.includes(origin) || origin.startsWith('http://localhost'));
      }

      // في بيئة الإنتاج: السماح لـ Vercel + ALLOWED_ORIGINS
      const allowedProd = [
        'https://car-auction-sand.vercel.app',
        'https://client-app-iota-eight.vercel.app',
        'https://client-app-iota-eight-daood-alhashdis-projects.vercel.app',
        ...(process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
          : [])
      ];

      // اقبل أي نطاق ينتهي بـ .vercel.app أو أي من القائمة
      const isVercel = origin.endsWith('.vercel.app');
      const isAllowed = allowedProd.includes(origin) || isVercel;

      callback(isAllowed ? null : new Error(`CORS blocked: ${origin}`), isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // إعدادات Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // الحد الأقصى للطلبات
    message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً'
  },

  // إعدادات Helmet
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws:", "wss:"]
      }
    }
  }
};

/**
 * إعدادات البريد الإلكتروني
 */
const email = {
  // معلومات SMTP
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === '465', // SSL للمنفذ 465

  // بيانات المصادقة
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },

  // إعدادات إضافية
  from: process.env.EMAIL_FROM || 'HM CAR <noreply@hmcar.com>',

  // القوالب
  templates: {
    welcome: 'emails/welcome',
    resetPassword: 'emails/reset-password',
    notification: 'emails/notification'
  }
};

/**
 * إعدادات التخزين السحابي
 */
const cloudinary = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',

  // إعدادات الرفع
  upload: {
    folder: 'hm-car',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    max_files: 5,
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
};

/**
 * إعدادات Redis (التخزين المؤقت)
 */
const redis = {
  enabled: process.env.REDIS_ENABLED === 'true',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB) || 0,

  // إعدادات التخزين المؤقت
  cache: {
    defaultTTL: 3600, // ساعة واحدة
    checkperiod: 600, // 10 دقائق
    maxKeys: 1000
  }
};

/**
 * إعدادات التطوير
 */
const development = {
  // تفعيل التصحيح
  debug: process.env.DEBUG === 'true',

  // إعدادات السجلات
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: '10m',
    maxFiles: '14d'
  },

  // إعدادة التطوير السريع
  hotReload: process.env.NODE_ENV !== 'production',

  // إعدادات الاختبار
  testing: {
    database: process.env.TEST_DB_URI || 'mongodb://127.0.0.1:27017/hm-car-test',
    timeout: 10000
  }
};

/**
 * تصدير جميع الإعدادات
 */
module.exports = {
  database,
  server,
  security,
  email,
  cloudinary,
  redis,
  development,

  // دالة مساعدة للتحقق من البيئة
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isTest: () => process.env.NODE_ENV === 'test',

  // دالة مساعدة للحصول على المسار
  getPath: (relativePath) => path.join(__dirname, '..', '..', relativePath),

  // دالة مساعدة للتحقق من المتغيرات المطلوبة
  getRequiredEnv: (varName) => {
    const value = process.env[varName];
    if (!value) {
      throw new Error(`متغير البيئة ${varName} مطلوب`);
    }
    return value;
  }
};
