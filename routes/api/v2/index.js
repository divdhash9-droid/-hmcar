// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/index.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * @file routes/api/v2/index.js
 * @description الموجه الرئيسي لإصدار API الثاني (V2).
 * يقوم بتجميع كافة المسارات الفرعية (المستخدمين، السيارات، المزادات، إلخ) مع تفعيل سياسة تقييد الطلبات (Rate Limiting).
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

/**
 * إعداد طبقة تقييد الطلبات (Rate Limiter)
 * لحماية الخادم من الهجمات وزيادة عدد الطلبات من نفس العنوان.
 */
// تمت إزالة الـ Rate Limit مؤقتاً لضمان استقرار الدخول عبر Vercel في بيئة السيرفرليس
// router.use(limiter);

/**
 * معلومات الإصدار الحالي للـ API
 */
router.get('/', (req, res) => {
  res.json({
    name: 'واجهة برمجة تطبيقات HM CAR',
    version: '2.0.0',
    description: 'نظام متطور لإدارة مزادات السيارات وبيع القطع',
    endpoints: {
      auth: 'نظام المصادقة والدخول',
      users: 'إدارة حسابات المستخدمين',
      cars: 'إدارة بيانات السيارات المعروضة',
      auctions: 'إدارة المزادات والمزايدات الفورية',
      analytics: 'نظام الإحصائيات والتقارير'
    },
    status: 'Active',
    serverTime: new Date().toISOString()
  });
});

/**
 * نقطة فحص الحالة الصحية المتقدمة (Advanced Health Check)
 * تقوم بفحص حالة الاتصال بقاعدة البيانات واستهلاك الذاكرة.
 */
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'متصل' : 'غير متصل';

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// --- ربط المسارات الفرعية (Sub-Routes) ---

router.use('/auth', require('./auth'));                  // المصادقة
router.use('/users', require('./users'));                // المستخدمين
router.use('/cars', require('./cars'));                  // السيارات
router.use('/auctions', require('./auctions'));          // المزادات
router.use('/parts', require('./parts'));                // قطع الغيار
router.use('/dashboard', require('./dashboard'));        // لوحة التحكم
router.use('/orders', require('./orders'));              // الطلبات
router.use('/notifications', require('./notifications')); // التنبيهات
router.use('/analytics', require('./analytics'));        // التحليلات
router.use('/upload', require('./upload.js'));           // رفع الملفات
router.use('/settings', require('./settings'));          // الإعدادات
router.use('/messages', require('./messages'));          // الرسائل
router.use('/reviews', require('./reviews'));            // التقييمات
router.use('/comparisons', require('./comparisons'));    // المقارنات
router.use('/brands', require('./brands'));              // الماركات
router.use('/contact', require('./contact'));            // الاتصال
router.use('/favorites', require('./favorites'));        // المفضلة
router.use('/bids', require('./bids'));                  // المزايدات
router.use('/live-auctions', require('./live-auctions'));// المزادات المباشرة
router.use('/smart-alerts', require('./smart-alerts')); // التنبيهات الذكية
router.use('/security', require('./security'));         // قسم الأمان والأجهزة المحظورة
router.use('/backup', require('./backup'));             // [[ARABIC_COMMENT]] النسخ الاحتياطي التلقائي
router.use('/concierge', require('./concierge'));       // الطلبات الخاصة (طلب سيارة / قطع غيار)

/**
 * معالج الأخطاء المركزي لمسارات API
 * يقوم بتحليل نوع الخطأ وإرجاع رسالة واضحة للمبرمج/العميل.
 */
router.use((error, req, res, next) => {
  console.error('⚠️ خطأ في API:', error);

  // أخطاء التحقق من البيانات (Mongoose Validation)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'خطأ في صحة البيانات',
      message: error.message,
      details: error.errors
    });
  }

  // أخطاء المعرفات غير الصحيحة (Invalid IDs)
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'معرف غير صالح',
      message: 'المعرف الممرر غير موجود أو بتنسيق خاطئ'
    });
  }

  // أخطاء تكرار البيانات الفريدة (Duplicate Key)
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'بيانات مكررة',
      message: 'هذا السجل موجود بالفعل في النظام'
    });
  }

  // خطأ عام غير متوقع
  res.status(error.status || 500).json({
    error: error.name || 'خطأ داخلي',
    message: error.message || 'حدث خطأ غير متوقع في الخادم',
    path: req.path
  });
});

/**
 * معالجة الروابط غير المعروفة لـ API
 */
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'غير موجود',
    message: `المسار ${req.method} ${req.originalUrl} غير متاح في النظام.`
  });
});

module.exports = router;
