// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/notifications.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const UserNotification = require('../../../models/UserNotification');
const AdvancedNotification = require('../../../models/AdvancedNotification');
const PushSubscription = require('../../../models/PushSubscription');
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
    await UserNotification.updateMany(
      { user: req.user.userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
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

// إرسال إشعار لجميع المستخدمين (للمشرفين فقط)
router.post('/broadcast', requireAuthAPI, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { title, message, url } = req.body;
    
    // إنشاء إشعار عام باستخدام AdvancedNotification
    await AdvancedNotification.broadcast({
      title,
      message,
      type: 'INFO',
      priority: 'HIGH',
      channels: ['IN_APP', 'PUSH'], // [[ARABIC_COMMENT]] الإرسال داخل التطبيق وكإشعار PWA
      actionUrl: url || null,
      actionText: url ? 'عرض التفاصيل' : null,
      category: 'GENERAL'
    });

    res.json({ success: true, message: 'Broadcast successful' });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ success: false, error: 'Failed to broadcast message' });
  }
});

/**
 * تسجيل اشتراك Push جديد لجهاز العميل
 */
router.post('/push/subscribe', requireAuthAPI, async (req, res) => {
  try {
    const { subscription, deviceInfo } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, error: 'Subscription data required' });
    }

    // [[ARABIC_COMMENT]] تحديث أو إنشاء اشتراك جديد لهذا الجهاز
    await PushSubscription.findOneAndUpdate(
      { user: req.user.userId, 'subscription.endpoint': subscription.endpoint },
      { 
        subscription, 
        deviceInfo: { ...deviceInfo, lastUsedAt: new Date() } 
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Push subscription registered' });
  } catch (error) {
    console.error('Push Subscribe error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * إلغاء اشتراك Push
 */
router.post('/push/unsubscribe', requireAuthAPI, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ user: req.user.userId, 'subscription.endpoint': endpoint });
    res.json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
