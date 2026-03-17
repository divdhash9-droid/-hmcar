// [[ARABIC_HEADER]] هذا الملف (models/AdvancedNotification.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const advancedNotificationSchema = new mongoose.Schema({
  // المستخدم المستهدف (null للإشعارات العامة)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // نوع الإشعار
  type: {
    type: String,
    enum: [
      'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL',
      'SYSTEM', 'USER', 'AUCTION', 'ORDER', 'PAYMENT',
      'SECURITY', 'BACKUP', 'MAINTENANCE', 'FEATURE'
    ],
    required: true
  },
  // عنوان الإشعار
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // محتوى الإشعار
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // رابط الإشعار (عند النقر عليه)
  actionUrl: {
    type: String,
    default: null
  },
  // نص الزر
  actionText: {
    type: String,
    default: null
  },
  // الأيقونة
  icon: {
    type: String,
    default: 'bell'
  },
  // اللون
  color: {
    type: String,
    enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
    default: 'blue'
  },
  // الأهمية
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  // القناة (كيف سيتم إرسال الإشعار)
  channels: [{
    type: String,
    enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'WEBHOOK'],
    default: 'IN_APP'
  }],
  // حالة الإشعار
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
    default: 'PENDING'
  },
  // وقت القراءة
  readAt: {
    type: Date,
    default: null
  },
  // وقت انتهاء الصلاحية
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  // البيانات المرفقة
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // الإعدادات
  settings: {
    // هل يمكن إغلاقه
    dismissible: {
      type: Boolean,
      default: true
    },
    // هل يظهر تلقائياً
    autoShow: {
      type: Boolean,
      default: true
    },
    // المدة بالثواني للإغلاق التلقائي
    autoHide: {
      type: Number,
      default: null
    },
    // هل يظهر صوت
    sound: {
      type: Boolean,
      default: false
    },
    // هل يهتز
    vibration: {
      type: Boolean,
      default: false
    }
  },
  // محاولات الإرسال
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  // آخر محاولة إرسال
  lastDeliveryAttempt: {
    type: Date,
    default: null
  },
  // رسالة الخطأ
  deliveryError: {
    type: String,
    default: null
  },
  // الفئة
  category: {
    type: String,
    enum: [
      'GENERAL', 'SECURITY', 'FINANCIAL', 'OPERATIONAL', 
      'MARKETING', 'SUPPORT', 'SYSTEM', 'USER_ACTION'
    ],
    default: 'GENERAL'
  },
  // العلامات
  tags: [{
    type: String,
    trim: true
  }],
  // الإشعار الأصلي (للردود)
  parentNotification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvancedNotification',
    default: null
  },
  // الردود
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
advancedNotificationSchema.index({ user: 1, status: 1, createdAt: -1 });
advancedNotificationSchema.index({ type: 1, createdAt: -1 });
advancedNotificationSchema.index({ priority: 1, createdAt: -1 });
advancedNotificationSchema.index({ category: 1, createdAt: -1 });
advancedNotificationSchema.index({ status: 1, createdAt: -1 });
advancedNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
advancedNotificationSchema.index({ tags: 1, createdAt: -1 });

// Static methods
advancedNotificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    
    // محاولة الإرسال الفوري
    await notification.send();
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

advancedNotificationSchema.statics.broadcast = async function(notificationData, userFilter = {}) {
  try {
    const User = mongoose.model('User');
    const users = await User.find(userFilter).select('_id');
    
    const notifications = users.map(user => ({
      ...notificationData,
      user: user._id
    }));
    
    const createdNotifications = await this.insertMany(notifications);
    
    // إرسال الإشعارات بشكل غير متزامن
    setImmediate(() => {
      createdNotifications.forEach(notification => {
        notification.send().catch(console.error);
      });
    });
    
    return createdNotifications;
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    throw error;
  }
};

advancedNotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    user: userId,
    status: { $in: ['PENDING', 'SENT', 'DELIVERED'] },
    readAt: null
  });
};

// Instance methods
advancedNotificationSchema.methods.send = async function() {
  try {
    this.deliveryAttempts += 1;
    this.lastDeliveryAttempt = new Date();
    
    // الإرسال حسب القنوات
    const sendPromises = [];
    
    if (this.channels.includes('IN_APP')) {
      // الإشعارات داخل التطبيق تكون جاهزة تلقائياً
      this.status = 'DELIVERED';
    }
    
    if (this.channels.includes('EMAIL') && this.user) {
      sendPromises.push(this.sendEmail());
    }
    
    if (this.channels.includes('SMS') && this.user) {
      sendPromises.push(this.sendSMS());
    }
    
    if (this.channels.includes('WHATSAPP') && this.user) {
      sendPromises.push(this.sendWhatsApp());
    }
    
    if (this.channels.includes('PUSH') && this.user) {
      sendPromises.push(this.sendPush());
    }
    
    if (this.channels.includes('WEBHOOK')) {
      sendPromises.push(this.sendWebhook());
    }
    
    if (sendPromises.length > 0) {
      const results = await Promise.allSettled(sendPromises);
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length === 0) {
        this.status = 'SENT';
      } else {
        this.status = 'PARTIAL';
        this.deliveryError = failures.map(f => f.reason.message).join('; ');
      }
    }
    
    await this.save();
    return this;
  } catch (error) {
    this.status = 'FAILED';
    this.deliveryError = error.message;
    await this.save();
    throw error;
  }
};

advancedNotificationSchema.methods.markAsRead = async function() {
  this.readAt = new Date();
  this.status = 'READ';
  return await this.save();
};

advancedNotificationSchema.methods.addReply = async function(userId, message) {
  this.replies.push({
    user: userId,
    message,
    createdAt: new Date()
  });
  return await this.save();
};

advancedNotificationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

advancedNotificationSchema.methods.isUnread = function() {
  return !this.readAt;
};

// Private methods
advancedNotificationSchema.methods.sendEmail = async function() {
  // هنا يتم إرسال الإشعار عبر البريد الإلكتروني
  // يمكن استخدام خدمات مثل SendGrid, Nodemailer, etc.
  console.log(`Sending email notification to user ${this.user}: ${this.title}`);
  return Promise.resolve();
};

advancedNotificationSchema.methods.sendSMS = async function() {
  // هنا يتم إرسال الإشعار via SMS
  // يمكن استخدام خدمات مثل Twilio, etc.
  console.log(`Sending SMS notification to user ${this.user}: ${this.title}`);
  return Promise.resolve();
};

advancedNotificationSchema.methods.sendWhatsApp = async function() {
  // هنا يتم إرسال الإشعار via WhatsApp
  // يمكن استخدام خدمات مثل WhatsApp Business API
  console.log(`Sending WhatsApp notification to user ${this.user}: ${this.title}`);
  return Promise.resolve();
};

advancedNotificationSchema.methods.sendPush = async function() {
  // هنا يتم إرسال إشعار Web Push حقيقي للمستخدم
  try {
    const NotificationService = require('../services/NotificationService');
    console.log(`Sending push notification to user ${this.user}: ${this.title}`);
    
    await NotificationService.sendPushToUser(this.user, {
      title: this.title,
      body: this.message,
      url: this.actionUrl || '/'
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error in sendPush instance method:', error);
    return Promise.reject(error);
  }
};


advancedNotificationSchema.methods.sendWebhook = async function() {
  // هنا يتم إرسال الإشعار via Webhook
  console.log(`Sending webhook notification: ${this.title}`);
  return Promise.resolve();
};

module.exports = mongoose.model('AdvancedNotification', advancedNotificationSchema);
