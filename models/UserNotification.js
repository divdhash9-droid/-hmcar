// [[ARABIC_HEADER]] هذا الملف (models/UserNotification.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'auction', 'message', 'order', 'system', 'smart_alert', 'promotion'],
    default: 'info'
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedToModel'
  },
  relatedToModel: {
    type: String,
    enum: ['Car', 'SparePart', 'Auction', 'Order', 'Message', 'User']
  },
  actionUrl: String,
  actionText: String,
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  metadata: {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    auctionStatus: String,
    bidAmount: Number,
    orderStatus: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
userNotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, type: 1, read: false });
userNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
userNotificationSchema.statics.createNotification = async function (data) {
  const notification = new this(data);
  await notification.save();

  // Emit real-time notification via socket.io
  try {
    if (global.io) {
      global.io.to(`user_${data.user}`).emit('notification', {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: new Date().toISOString(),
        data: {
          actionUrl: notification.actionUrl,
          actionText: notification.actionText
        }
      });
    }
  } catch (e) {
    // ignore websocket errors - do not block notification creation
    console.warn('WebSocket emit failed:', e && e.message);
  }

  // Send push notification if available
  await this.sendPushNotification(data.user, notification);

  return notification;
};

userNotificationSchema.statics.sendPushNotification = async function (userId, notification) {
  try {
    // [[ARABIC_COMMENT]] إرسال إشعار Web Push حقيقي للمشتركين عبر المتصفح/PWA
    const NotificationService = require('../services/NotificationService');
    await NotificationService.sendPushToUser(userId, {
      title: notification.title,
      body: notification.message,
      url: notification.actionUrl || '/'
    });
    
    console.log(`[Notification] Sent push to user ${userId} via WebPush: ${notification.title}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Instance methods
userNotificationSchema.methods.markAsRead = async function () {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

userNotificationSchema.methods.toJSON = function () {
  const notification = this.toObject();
  if (notification.expiresAt && notification.expiresAt < new Date()) {
    notification.expired = true;
  }
  return notification;
};

module.exports = mongoose.model('UserNotification', userNotificationSchema);
