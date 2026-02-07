// [[ARABIC_HEADER]] هذا الملف (routes/notifications.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const UserNotification = require('../models/UserNotification');
const UserNotificationPreference = require('../models/UserNotificationPreference');
const { requireAuthAPI } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', requireAuthAPI, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    const filter = { user: req.user._id };
    
    if (type) filter.type = type;
    if (unreadOnly === 'true') filter.read = false;
    
    const notifications = await UserNotification.find(filter)
      .populate('relatedTo')
      .populate('metadata.sender', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await UserNotification.countDocuments(filter);
    const unreadCount = await UserNotification.countDocuments({ 
      user: req.user._id, 
      read: false 
    });
    
    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notifications count
router.get('/unread-count', requireAuthAPI, async (req, res) => {
  try {
    const count = await UserNotification.countDocuments({
      user: req.user._id,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', requireAuthAPI, async (req, res) => {
  try {
    const notification = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }
    
    await notification.markAsRead();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', requireAuthAPI, async (req, res) => {
  try {
    await UserNotification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'تم تعليم جميع الإشعارات كمقروءة' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', requireAuthAPI, async (req, res) => {
  try {
    const result = await UserNotification.deleteOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }
    
    res.json({ message: 'تم حذف الإشعار' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all notifications
router.delete('/', requireAuthAPI, async (req, res) => {
  try {
    await UserNotification.deleteMany({ user: req.user._id });
    res.json({ message: 'تم حذف جميع الإشعارات' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notification (for internal use)
router.post('/', requireAuthAPI, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح لك' });
    }
    
    const notification = await UserNotification.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification preferences
router.get('/preferences', requireAuthAPI, async (req, res) => {
  try {
    let prefs = await UserNotificationPreference.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await UserNotificationPreference.create({ user: req.user._id });
    }

    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.patch('/preferences', requireAuthAPI, async (req, res) => {
  try {
    const toBool = (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
      }
      return undefined;
    };

    let prefs = await UserNotificationPreference.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = new UserNotificationPreference({ user: req.user._id });
    }

    const allowedTopLevel = [
      'outbid',
      'auctionEndingSoon',
      'newBidOnWatched',
      'auctionWon',
      'auctionLost',
      'newMessage',
      'systemUpdates',
      'promotions'
    ];

    const allowedNested = {
      emailNotifications: ['outbid', 'auctionWon', 'promotions'],
      pushNotifications: ['outbid', 'newMessage', 'auctionEndingSoon']
    };

    for (const key of allowedTopLevel) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const parsed = toBool(req.body[key]);
        if (parsed !== undefined) prefs[key] = parsed;
      }
    }

    for (const groupKey of Object.keys(allowedNested)) {
      if (req.body && typeof req.body[groupKey] === 'object' && req.body[groupKey] !== null) {
        for (const key of allowedNested[groupKey]) {
          if (Object.prototype.hasOwnProperty.call(req.body[groupKey], key)) {
            const parsed = toBool(req.body[groupKey][key]);
            if (parsed !== undefined) prefs[groupKey][key] = parsed;
          }
        }
      }
    }

    await prefs.save();
    res.json({ message: 'تم تحديث تفضيلات الإشعارات', preferences: prefs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
