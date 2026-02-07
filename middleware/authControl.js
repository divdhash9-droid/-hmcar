// [[ARABIC_HEADER]] هذا الملف (middleware/authControl.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const AuthSettings = require('../models/AuthSettings');

// Middleware للتحكم في المصادقة
const authControl = async (req, res, next) => {
  try {
    // الحصول على إعدادات المصادقة
    const authSettings = await AuthSettings.getSettings();
    
    // التحقق من وضع التطوير
    if (authSettings.developmentMode) {
      const userEmail = req.body.email || req.session.user?.email || '';
      
      // إذا كان المستخدم في قائمة المطورين، تجاوز المصادقة
      if (authSettings.developmentUsers.includes(userEmail)) {
        console.log(`🔓 Development Mode: Bypassing auth for ${userEmail}`);
        
        // إذا لم يكن المستخدم مسجل دخوله، قم بإنشاء جلسة تلقائية
        if (!req.session.user) {
          const User = require('../models/User');
          let user = await User.findOne({ email: userEmail });
          
          if (!user) {
            // إنشاء مستخدم جديد إذا لم يوجد
            user = new User({
              email: userEmail,
              name: userEmail.split('@')[0],
              role: 'buyer',
              isActive: true,
              deviceFingerprint: 'dev-mode-' + Date.now()
            });
            await user.save();
          }
          
          req.session.user = user;
        }
        
        return next();
      }
    }
    
    // التحقق من نظام المصادقة
    if (!authSettings.authenticationEnabled) {
      console.log('🔓 Authentication Disabled: Allowing access');
      
      // إذا كانت المصادقة معطلة، قم بإنشاء جلسة عميل تلقائية
      if (!req.session.user) {
        const User = require('../models/User');
        const defaultUser = await User.findOne({ email: 'guest@hmcar.com' });
        
        if (defaultUser) {
          req.session.user = defaultUser;
        } else {
          // إنشاء مستخدم ضيف افتراضي
          const guestUser = new User({
            email: 'guest@hmcar.com',
            name: 'Guest User',
            role: 'buyer',
            isActive: true,
            deviceFingerprint: 'guest-mode-' + Date.now()
          });
          await guestUser.save();
          req.session.user = guestUser;
        }
      }
      
      return next();
    }
    
    // السماح بتسجيل الدخول المتعدد
    if (authSettings.allowMultipleLogins) {
      req.allowMultipleLogins = true;
    }
    
    // السماح بتسجيل الدخول بدون كلمة مرور
    if (authSettings.allowPasswordlessLogin) {
      req.allowPasswordlessLogin = true;
    }
    
    next();
  } catch (error) {
    console.error('Error in authControl middleware:', error);
    next();
  }
};

// Middleware للتحقق من صلاحيات التحكم في المصادقة
const requireAuthController = async (req, res, next) => {
  try {
    const authSettings = await AuthSettings.getSettings();
    const userEmail = req.session.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }
    
    if (!authSettings.isAuthController(userEmail)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية التحكم في المصادقة' });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireAuthController middleware:', error);
    res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
  }
};

// Middleware للتحقق من المصادقة مع التجاوز
const flexibleAuth = async (req, res, next) => {
  try {
    const authSettings = await AuthSettings.getSettings();
    
    // إذا كانت المصادقة معطلة أو في وضع التطوير، تجاوز التحقق
    if (!authSettings.isAuthenticationEnabled()) {
      return next();
    }
    
    // التحقق من الجلسة
    if (!req.session.user) {
      // إذا كان المسار هو API، إرجاع خطأ JSON
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      }
      
      // إعادة التوجيه لصفحة تسجيل الدخول
      return res.redirect('/auth/login');
    }
    
    next();
  } catch (error) {
    console.error('Error in flexibleAuth middleware:', error);
    next();
  }
};

module.exports = {
  authControl,
  requireAuthController,
  flexibleAuth
};
