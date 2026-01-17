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
    
    res.render('client/dashboard', {
      currentUser: user,
      title: 'لوحة تحكم العميل',
      hideNavbar: true,
      hideFooter: true,
      fullWidth: true
    });
  } catch (error) {
    console.error('Error loading client dashboard:', error);
    res.redirect('/auth/login');
  }
});

// مسار حساب العميل (سيتم تضمينه من مسار منفصل)
const clientProfileRoutes = require('./client-profile');
router.use(clientProfileRoutes);

module.exports = router;