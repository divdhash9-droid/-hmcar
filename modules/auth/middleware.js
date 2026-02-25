// [[ARABIC_HEADER]] هذا الملف (modules/auth/middleware.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[ملف الوسيط للمصادقة]] - modules/auth/middleware.js
 * 
 * هذا الملف يحتوي على جميع الوسطاء (middleware) للمصادقة
 * - التحقق من تسجيل الدخول
 * - التحقق من الصلاحيات
 * - حماية المسارات
 * 
 * @author HM CAR Team
 */

const authService = require('./auth-service');
const logger = require('../core/logger');

/**
 * وسيط للتحقق من تسجيل الدخول
 */
const requireAuth = (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      logger.security('محاولة الوصول لمسار محمي بدون تسجيل دخول', null, req.ip);
      
      // حفظ المسار المطلوب للعودة إليه بعد الدخول
      req.session.returnTo = req.originalUrl;
      
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ 
          error: 'يجب تسجيل الدخول للوصول إلى هذا المورد' 
        });
      }
      
      return res.redirect('/auth/login');
    }
    
    // إضافة معلومات المستخدم للطلب
    req.user = req.session.user;
    next();
  } catch (error) {
    logger.error('خطأ في وسيط التحقق من المصادقة', error);
    res.status(500).json({ error: 'خطأ في التحقق من المصادقة' });
  }
};

/**
 * وسيط للتحقق من الصلاحيات
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        logger.security('محاولة الوصول لمسار غير مصرح به', req.user.id, req.ip, {
          userRole,
          requiredRoles: allowedRoles,
          path: req.path
        });
        
        if (req.path.startsWith('/api')) {
          return res.status(403).json({ 
            error: 'ليس لديك صلاحية للوصول إلى هذا المورد' 
          });
        }
        
        return res.status(403).render('errors/403', { 
          layout: 'layout',
          error: 'ليس لديك صلاحية للوصول إلى هذه الصفحة' 
        });
      }

      next();
    } catch (error) {
      logger.error('خطأ في وسيط التحقق من الصلاحيات', error);
      res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
    }
  };
};

/**
 * وسيط للتحقق من صلاحيات محددة
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      }

      const userPermissions = req.user.permissions || {};
      
      // الأدمن لديه كل الصلاحيات
      if (req.user.role === 'super_admin' || req.user.role === 'admin') {
        return next();
      }

      if (!userPermissions[permission]) {
        logger.security('محاولة الوصول لميزة غير مصرح بها', req.user.id, req.ip, {
          permission,
          userPermissions,
          path: req.path
        });
        
        if (req.path.startsWith('/api')) {
          return res.status(403).json({ 
            error: 'ليس لديك صلاحية لاستخدام هذه الميزة' 
          });
        }
        
        return res.status(403).render('errors/403', { 
          layout: 'layout',
          error: 'ليس لديك صلاحية لاستخدام هذه الميزة' 
        });
      }

      next();
    } catch (error) {
      logger.error('خطأ في وسيط التحقق من الصلاحيات المحددة', error);
      res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
    }
  };
};

/**
 * وسيط للتحقق من ملكية المورد
 */
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      }

      // الأدمن لديه صلاحية الوصول لكل الموارد
      if (req.user.role === 'super_admin' || req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params.id;
      let resource;

      switch (resourceType) {
        case 'user':
          resource = await require('../../models/User').findById(resourceId);
          break;
        case 'car':
          resource = await require('../../models/Car').findById(resourceId);
          break;
        case 'auction':
          resource = await require('../../models/Auction').findById(resourceId);
          break;
        default:
          return res.status(400).json({ error: 'نوع المورد غير صالح' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'المورد غير موجود' });
      }

      // التحقق من أن المستخدم هو المالك
      if (resource.owner && resource.owner.toString() !== req.user.id) {
        logger.security('محاولة الوصول لمورد غير مملوك', req.user.id, req.ip, {
          resourceType,
          resourceId,
          resourceOwner: resource.owner
        });
        
        return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('خطأ في وسيط التحقق من الملكية', error);
      res.status(500).json({ error: 'خطأ في التحقق من الملكية' });
    }
  };
};

/**
 * وسيط للتحقق من بصمة الجهاز
 */
const requireDeviceAuth = (req, res, next) => {
  try {
    const clientInfo = authService.getClientInfo(req);
    
    // إضافة معلومات الجهاز للطلب
    req.deviceInfo = clientInfo;
    
    next();
  } catch (error) {
    logger.error('خطأ في وسيط التحقق من الجهاز', error);
    next();
  }
};

/**
 * وسيط لتسجيل طلبات API
 */
const logApiRequest = (req, res, next) => {
  const startTime = Date.now();
  
  // تسجيل الطلب عند البدء
  logger.api(req.method, req.path, req.user?.id);
  
  // تسجيل الرد عند الانتهاء
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.api(req.method, req.path, req.user?.id, res.statusCode);
    logger.info(`مدة الاستجابة: ${duration}ms`);
  });
  
  next();
};

/**
 * وسيط للتحقق من CSRF
 */
const requireCSRF = (req, res, next) => {
  try {
    // تجاهل CSRF لطلبات API
    if (req.path.startsWith('/api')) {
      return next();
    }

    const token = req.session.csrfToken;
    const requestToken = req.body._csrf || req.headers['x-csrf-token'];

    if (!token || !requestToken || token !== requestToken) {
      logger.security('محاولة طلب بدون رمز CSRF صالح', req.user?.id, req.ip);
      
      return res.status(403).json({ 
        error: 'رمز CSRF غير صالح' 
      });
    }

    next();
  } catch (error) {
    logger.error('خطأ في وسيط التحقق من CSRF', error);
    res.status(500).json({ error: 'خطأ في التحقق من CSRF' });
  }
};

/**
 * وسيط للتحقق من معدل الطلبات
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // تنظيف الطلبات القديمة
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    // التحقق من عدد الطلبات
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      logger.security('تجاوز الحد الأقصى للطلبات', req.user?.id, req.ip, {
        requests: userRequests.length,
        maxRequests
      });
      
      return res.status(429).json({ 
        error: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً' 
      });
    }

    // إضافة الطلب الحالي
    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireOwnership,
  requireDeviceAuth,
  logApiRequest,
  requireCSRF,
  rateLimiter
};
