// [[ARABIC_HEADER]] هذا الملف (routes/client-profile.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// routes/client-profile.js
// مسارات إدارة حساب العميل (Profile, Security, Devices)
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// عرض صفحة الملف الشخصي
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    if (!user || user.role !== 'buyer') {
      return res.redirect('/auth/login');
    }
    
    res.render('client/profile', {
      currentUser: user,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.redirect('/auth/login');
  }
});

// تحديث الملف الشخصي
router.post('/profile/update', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, securityLevel } = req.body;
    const userId = req.session.user._id;
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (phone) updates.phone = phone;
    if (securityLevel) updates.securityLevel = securityLevel;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, select: '-password' }
    );
    
    // تحديث معلومات الجلسة
    req.session.user.name = user.name;
    
    res.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.json({ success: false, message: 'حدث خطأ أثناء تحديث الملف الشخصي' });
  }
});

// تغيير كلمة المرور
router.post('/profile/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.user._id;
    
    if (newPassword !== confirmNewPassword) {
      return res.json({ success: false, message: 'كلمتا المرور الجديدة غير متطابقتين' });
    }
    
    if (newPassword.length < 6) {
      return res.json({ success: false, message: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'لم يتم العثور على المستخدم' });
    }
    
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.json({ success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' });
  }
});

// تفعيل/تعطيل المصادقة الثنائية
router.post('/profile/toggle-2fa', requireAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.session.user._id;
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        twoFactorEnabled: enabled,
        twoFactorEnabledAt: enabled ? new Date() : null
      }
    });
    
    res.json({ success: true, message: enabled ? 'تم تفعيل المصادقة الثنائية' : 'تم تعطيل المصادقة الثنائية' });
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    res.json({ success: false, message: 'حدث خطأ أثناء تغيير إعدادات المصادقة الثنائية' });
  }
});

// تفعيل/تعطيل ربط الأجهزة
router.post('/profile/toggle-device-binding', requireAuth, async (req, res) => {
  try {
    const { allowMultiple } = req.body;
    const userId = req.session.user._id;
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        allowMultipleSessions: allowMultiple
      }
    });
    
    res.json({ success: true, message: allowMultiple ? 'السماح بجهاز متعدد مفعل' : 'ربط الجهاز مفعل' });
  } catch (error) {
    console.error('Error toggling device binding:', error);
    res.json({ success: false, message: 'حدث خطأ أثناء تغيير إعدادات ربط الجهاز' });
  }
});

// إزالة جهاز
router.post('/profile/remove-device', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.session.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'لم يتم العثور على المستخدم' });
    }
    
    user.boundDevices = user.boundDevices.filter(device => device._id.toString() !== deviceId);
    await user.save();
    
    res.json({ success: true, message: 'تم إزالة الجهاز بنجاح' });
  } catch (error) {
    console.error('Error removing device:', error);
    res.json({ success: false, message: 'حدث خطأ أثناء إزالة الجهاز' });
  }
});

// مسح جميع الأجهزة
router.post('/profile/clear-all-devices', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        boundDevices: [],
        deviceInfo: {}
      }
    });
    
    res.json({ success: true, message: 'تم مسح جميع الأجهزة بنجاح' });
  } catch (error) {
    console.error('Error clearing devices:', error);
    res.json({ success: false, message: 'حدث خطأ أثناء مسح الأجهزة' });
  }
});

module.exports = router;