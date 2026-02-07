// [[ARABIC_HEADER]] هذا الملف (routes/auth-control.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const AuthSettings = require('../models/AuthSettings');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireAuthController } = require('../middleware/authControl');

// الحصول على إعدادات المصادقة
router.get('/settings', requireAuth, requireAuthController, async (req, res) => {
  try {
    const settings = await AuthSettings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching auth settings:', error);
    res.status(500).json({ success: false, error: 'خطأ في جلب الإعدادات' });
  }
});

// تحديث إعدادات المصادقة
router.post('/settings', requireAuth, requireAuthController, async (req, res) => {
  try {
    const { field, value } = req.body;
    const changedBy = req.session.user.email;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    // التحقق من الحقول المسموح بها
    const allowedFields = [
      'authenticationEnabled',
      'allowMultipleLogins',
      'requireEmailVerification',
      'requireDeviceVerification',
      'autoLoginEnabled',
      'developmentMode',
      'developmentUsers',
      'maxLoginAttempts',
      'lockoutDuration',
      'allowPasswordlessLogin',
      'rememberMeDays',
      'authControllers'
    ];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, error: 'حقل غير مسموح به' });
    }
    
    const settings = await AuthSettings.updateSetting(
      field, 
      value, 
      changedBy, 
      ipAddress, 
      userAgent
    );
    
    res.json({ 
      success: true, 
      message: `تم تحديث ${field} بنجاح`,
      settings 
    });
  } catch (error) {
    console.error('Error updating auth settings:', error);
    res.status(500).json({ success: false, error: 'خطأ في تحديث الإعدادات' });
  }
});

// تبديل المصادقة (إيقاف/تشغيل)
router.post('/toggle-auth', requireAuth, requireAuthController, async (req, res) => {
  try {
    const settings = await AuthSettings.getSettings();
    const changedBy = req.session.user.email;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    const oldValue = settings.authenticationEnabled;
    const newValue = !oldValue;
    
    settings.authenticationEnabled = newValue;
    await settings.logChange(changedBy, 'authenticationEnabled', oldValue, newValue, ipAddress, userAgent);
    await settings.save();
    
    res.json({ 
      success: true, 
      message: newValue ? 'تم تفعيل المصادقة' : 'تم إيقاف المصادقة',
      authenticationEnabled: newValue
    });
  } catch (error) {
    console.error('Error toggling authentication:', error);
    res.status(500).json({ success: false, error: 'خطأ في تبديل المصادقة' });
  }
});

// تبديل وضع التطوير
router.post('/toggle-dev-mode', requireAuth, requireAuthController, async (req, res) => {
  try {
    const settings = await AuthSettings.getSettings();
    const changedBy = req.session.user.email;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    const oldValue = settings.developmentMode;
    const newValue = !oldValue;
    
    settings.developmentMode = newValue;
    await settings.logChange(changedBy, 'developmentMode', oldValue, newValue, ipAddress, userAgent);
    await settings.save();
    
    res.json({ 
      success: true, 
      message: newValue ? 'تم تفعيل وضع التطوير' : 'تم إيقاف وضع التطوير',
      developmentMode: newValue
    });
  } catch (error) {
    console.error('Error toggling development mode:', error);
    res.status(500).json({ success: false, error: 'خطأ في تبديل وضع التطوير' });
  }
});

// إضافة مستخدم لوضع التطوير
router.post('/add-dev-user', requireAuth, requireAuthController, async (req, res) => {
  try {
    const { email } = req.body;
    const changedBy = req.session.user.email;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
    }
    
    const settings = await AuthSettings.getSettings();
    
    if (!settings.developmentUsers.includes(email)) {
      settings.developmentUsers.push(email);
      await settings.logChange(changedBy, 'developmentUsers', settings.developmentUsers, [...settings.developmentUsers, email], ipAddress, userAgent);
      await settings.save();
    }
    
    res.json({ 
      success: true, 
      message: `تم إضافة ${email} إلى وضع التطوير`,
      developmentUsers: settings.developmentUsers
    });
  } catch (error) {
    console.error('Error adding development user:', error);
    res.status(500).json({ success: false, error: 'خطأ في إضافة مستخدم التطوير' });
  }
});

// إزالة مستخدم من وضع التطوير
router.post('/remove-dev-user', requireAuth, requireAuthController, async (req, res) => {
  try {
    const { email } = req.body;
    const changedBy = req.session.user.email;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
    }
    
    const settings = await AuthSettings.getSettings();
    const oldUsers = [...settings.developmentUsers];
    settings.developmentUsers = settings.developmentUsers.filter(user => user !== email);
    
    await settings.logChange(changedBy, 'developmentUsers', oldUsers, settings.developmentUsers, ipAddress, userAgent);
    await settings.save();
    
    res.json({ 
      success: true, 
      message: `تم إزالة ${email} من وضع التطوير`,
      developmentUsers: settings.developmentUsers
    });
  } catch (error) {
    console.error('Error removing development user:', error);
    res.status(500).json({ success: false, error: 'خطأ في إزالة مستخدم التطوير' });
  }
});

// الحصول على سجل التغييرات
router.get('/change-log', requireAuth, requireAuthController, async (req, res) => {
  try {
    const settings = await AuthSettings.getSettings();
    const changeLog = settings.changeLog.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    
    res.json({ 
      success: true, 
      changeLog 
    });
  } catch (error) {
    console.error('Error fetching change log:', error);
    res.status(500).json({ success: false, error: 'خطأ في جلب سجل التغييرات' });
  }
});

// إعادة تعيين الإعدادات
router.post('/reset', requireAuth, requireAuthController, async (req, res) => {
  try {
    const changedBy = req.session.user.email;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    // حذف الإعدادات الحالية وإنشاء إعدادات جديدة
    await AuthSettings.deleteMany({});
    const newSettings = new AuthSettings();
    await newSettings.save();
    
    res.json({ 
      success: true, 
      message: 'تم إعادة تعيين الإعدادات بنجاح',
      settings: newSettings
    });
  } catch (error) {
    console.error('Error resetting auth settings:', error);
    res.status(500).json({ success: false, error: 'خطأ في إعادة تعيين الإعدادات' });
  }
});

// الحصول على حالة المصادقة الحالية
router.get('/status', async (req, res) => {
  try {
    const settings = await AuthSettings.getSettings();
    
    res.json({ 
      success: true, 
      status: {
        authenticationEnabled: settings.authenticationEnabled,
        developmentMode: settings.developmentMode,
        allowMultipleLogins: settings.allowMultipleLogins,
        allowPasswordlessLogin: settings.allowPasswordlessLogin,
        currentUser: req.session.user?.email || null,
        canBypassAuth: req.session.user ? settings.canBypassAuth(req.session.user.email) : false,
        isAuthController: req.session.user ? settings.isAuthController(req.session.user.email) : false
      }
    });
  } catch (error) {
    console.error('Error fetching auth status:', error);
    res.status(500).json({ success: false, error: 'خطأ في جلب حالة المصادقة' });
  }
});

module.exports = router;
