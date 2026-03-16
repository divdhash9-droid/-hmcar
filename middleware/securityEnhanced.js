// [[ARABIC_HEADER]] هذا الملف (middleware/securityEnhanced.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * middleware/securityEnhanced.js
 * ميدلوير الأمان المحسن
 * 
 * الميزات:
 * - حماية متقدمة من هجمات الـ Brute Force
 * - كشف الأنشطة المشبوهة
 * - تسجيل محاولات الاختراق
 * - حماية من الـ SQL/NoSQL Injection
 */

const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

/**
 * تخزين مؤقت لتتبع المحاولات المشبوهة
 */
const suspiciousAttempts = new Map();
const blockedIPs = new Set();

/**
 * تنظيف IP متعدد (proxy)
 */
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress;
};

/**
 * تسجيل نشاط مشبوه
 */
const logSuspiciousActivity = (req, reason, severity = 'medium') => {
  const ip = getClientIP(req);
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const logEntry = {
    timestamp,
    ip,
    method: req.method,
    path: req.path,
    userAgent,
    reason,
    severity,
    body: severity === 'high' ? JSON.stringify(req.body).substring(0, 500) : undefined
  };
  
  console.warn(`⚠️ [SECURITY] ${severity.toUpperCase()}: ${reason}`, logEntry);
  
  // تحديث سجل المحاولات المشبوهة
  const attempts = suspiciousAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  attempts.reasons = attempts.reasons || [];
  attempts.reasons.push(reason);
  suspiciousAttempts.set(ip, attempts);
  
  // حظر تلقائي بعد عدد معين من المحاولات
  if (attempts.count >= 10) {
    blockedIPs.add(ip);
    console.error(`🚫 [SECURITY] IP ${ip} has been auto-blocked after ${attempts.count} suspicious attempts`);
  }
};

/**
 * التحقق من IP محظور
 */
const checkBlockedIP = (req, res, next) => {
  const ip = getClientIP(req);
  
  if (blockedIPs.has(ip)) {
    console.warn(`🚫 [SECURITY] Blocked IP attempted access: ${ip}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Your IP has been temporarily blocked due to suspicious activity'
    });
  }
  
  next();
};

/**
 * كشف محاولات الحقن
 */
const detectInjection = (req, res, next) => {
  const suspicious = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    
    // NoSQL Injection patterns
    /\$where/i,
    /\$gt|\$lt|\$ne|\$eq|\$regex/i,
    /\{\s*\$\w+/,
    
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:\s*text\/html/i,
    
    // Path traversal
    /\.\.\//,
    /\.\.\\/, 
    
    // Command injection
    /[;&|`$]/,
    /\b(cat|ls|dir|pwd|whoami|wget|curl)\b/i
  ];
  
  const checkValue = (value, location) => {
    if (typeof value !== 'string') return;
    
    for (const pattern of suspicious) {
      if (pattern.test(value)) {
        logSuspiciousActivity(req, `Potential injection detected in ${location}: ${pattern}`, 'high');
        return true;
      }
    }
    return false;
  };
  
  const checkObject = (obj, location) => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const [key, value] of Object.entries(obj)) {
      // تحقق من اسم المفتاح أيضاً
      if (checkValue(key, `${location}.key`)) return true;
      
      if (typeof value === 'string') {
        if (checkValue(value, `${location}.${key}`)) return true;
      } else if (typeof value === 'object' && value !== null) {
        if (checkObject(value, `${location}.${key}`)) return true;
      }
    }
    return false;
  };
  
  // فحص الـ body
  if (checkObject(req.body, 'body')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
  
  // فحص الـ query
  if (checkObject(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
  
  // فحص الـ params
  if (checkObject(req.params, 'params')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
  
  next();
};

/**
 * Rate Limiter للمصادقة
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // تم الرفع إلى 10 محاولات لتقليل حظر المستخدمين بالخطأ
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSuspiciousActivity(req, 'Rate limit exceeded for authentication', 'high');
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // استخدام IP + Device ID للتعريف
    return `${getClientIP(req)}_${req.deviceId || 'unknown'}`;
  }
});

/**
 * Rate Limiter للمزايدات
 */
const bidRateLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 10, // 10 مزايدات في الدقيقة
  message: {
    success: false,
    error: 'Too many bids',
    message: 'Please slow down',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter للـ API
 */
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة
  max: 60, // 60 طلب في الدقيقة
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter للبحث
 */
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: 'Too many search requests',
    retryAfter: '1 minute'
  }
});

/**
 * التحقق من User Agent
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.headers['user-agent'];
  
  // حظر طلبات بدون User Agent
  if (!userAgent) {
    logSuspiciousActivity(req, 'Request without User-Agent', 'low');
    // السماح ولكن مع تسجيل
  }
  
  // كشف البوتات المشبوهة
  const suspiciousBots = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /dirbuster/i,
    /gobuster/i,
    /wpscan/i,
    /burp/i,
    /zap/i,
    /acunetix/i
  ];
  
  if (userAgent && suspiciousBots.some(bot => bot.test(userAgent))) {
    logSuspiciousActivity(req, `Suspicious bot detected: ${userAgent}`, 'high');
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  next();
};

/**
 * حماية CSRF محسنة
 */
const csrfProtection = (req, res, next) => {
  // تخطي طلبات GET و HEAD و OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // التحقق من Origin/Referer
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      logSuspiciousActivity(req, `CSRF attempt: Origin mismatch (${originHost} vs ${host})`, 'high');
      return res.status(403).json({
        success: false,
        error: 'Invalid request origin'
      });
    }
  }
  
  next();
};

/**
 * إضافة headers الأمان
 */
const securityHeaders = (req, res, next) => {
  // إضافة Request ID للتتبع
  const requestId = crypto.randomBytes(8).toString('hex');
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Headers أمان إضافية
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

/**
 * تنظيف الـ query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // إزالة أحرف خاصة خطيرة
        req.query[key] = value
          .replace(/[<>'"]/g, '')
          .substring(0, 1000); // حد أقصى 1000 حرف
      }
    }
  }
  next();
};

/**
 * مجموعة ميدلوير الأمان الكاملة
 */
const fullSecurityMiddleware = [
  checkBlockedIP,
  securityHeaders,
  validateUserAgent,
  sanitizeQuery,
  detectInjection
];

/**
 * تصدير جميع الميدلوير
 */
module.exports = {
  checkBlockedIP,
  detectInjection,
  authRateLimiter,
  bidRateLimiter,
  apiRateLimiter,
  searchRateLimiter,
  validateUserAgent,
  csrfProtection,
  securityHeaders,
  sanitizeQuery,
  fullSecurityMiddleware,
  logSuspiciousActivity,
  getClientIP,
  // للاختبار والإدارة
  blockedIPs,
  suspiciousAttempts
};
