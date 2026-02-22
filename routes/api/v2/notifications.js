// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/notifications.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const UserNotification = require('../../../models/UserNotification');
const { requireAuthAPI } = require('../../../middleware/auth');

// جلب جميع الإشعارات للمستخدم الحالي
router.get('/', requireAuthAPI, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تعيين الإشعارات كمقروءة
router.post('/read', requireAuthAPI, async (req, res) => {
  try {
    await UserNotification.updateMany({ user: req.user.userId, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// إنشاء إشعار يدوي (للاختبار)
router.post('/send', requireAuthAPI, async (req, res) => {
  try {
    const { title, message, type, actionUrl } = req.body;
    await UserNotification.createNotification({
      user: req.user.userId,
      title,
      message,
      type,
      actionUrl
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
