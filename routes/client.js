// [[ARABIC_HEADER]] هذا الملف (routes/client.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// routes/client.js
// مسارات واجهة العميل (Client Panel)
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

// لوحة تحكم العميل
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    if (!user || user.role !== 'buyer') {
      return res.redirect('/auth/login');
    }

    // تم إلغاء لوحة /client/dashboard لصالح صفحة /cars
    return res.redirect('/cars');
    
  } catch (error) {
    console.error('Error loading client dashboard:', error);
    res.redirect('/auth/login');
  }
});

// Notification settings (client)
router.get('/notification-settings', requireAuth, (req, res) => {
  res.render('client/notification-settings', {
    title: 'إعدادات الإشعارات',
    bodyClass: 'hm-client-dashboard'
  });
});

// Backward compatibility: some templates/js may still link here
router.get('/notifications', requireAuth, (req, res) => {
  return res.redirect('/client/notification-settings');
});

// مسار حساب العميل (سيتم تضمينه من مسار منفصل)
const clientProfileRoutes = require('./client-profile');
router.use(clientProfileRoutes);

module.exports = router;