const express = require('express');
const router = express.Router();
const UserNotification = require('../../../models/UserNotification');
const { requireAuth } = require('../../../middleware/auth');

// جلب جميع الإشعارات للمستخدم الحالي
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تعيين الإشعارات كمقروءة
router.post('/read', requireAuth, async (req, res) => {
  try {
    await UserNotification.updateMany({ user: req.session.user._id, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// إنشاء إشعار يدوي (للاختبار)
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { title, message, type, actionUrl } = req.body;
    await UserNotification.createNotification({
      user: req.session.user._id,
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
