// [[ARABIC_HEADER]] هذا الملف (models/ClientSession.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

// نموذج جلسات العملاء لتتبع الجلسات النشطة
const clientSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // معلومات الجهاز والشبكة
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceFingerprint: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    default: 'unknown'
  },
  browser: {
    type: String,
    default: 'unknown'
  },
  
  // معلومات التوقيت
  loginTime: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date
  },
  
  // حالة الجلسة
  isActive: {
    type: Boolean,
    default: true
  },
  terminatedAt: {
    type: Date
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // معلومات إضافية
  location: {
    country: String,
    city: String,
    timezone: String
  },
  
  // إحصائيات
  pageViews: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0 // بالدقائق
  }
}, {
  timestamps: true
});

// فهارس للبحث السريع
clientSessionSchema.index({ userId: 1, isActive: 1 });
clientSessionSchema.index({ deviceFingerprint: 1, isActive: 1 });
clientSessionSchema.index({ ip: 1, isActive: 1 });
clientSessionSchema.index({ lastActivity: -1 });

// دالة لتنظيف الجلسات القديمة
clientSessionSchema.statics.cleanupOldSessions = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
  const result = await this.deleteMany({
    $or: [
      { lastActivity: { $lt: cutoffDate } },
      { isActive: false, logoutTime: { $lt: cutoffDate } }
    ]
  });
  return result.deletedCount;
};

// دالة للحصول على الجلسات النشطة للمستخدم
clientSessionSchema.statics.getActiveSessions = async function(userId) {
  return await this.find({
    userId: userId,
    isActive: true
  }).sort({ lastActivity: -1 });
};

// دالة للتحقق من وجود جلسة نشطة للجهاز
clientSessionSchema.statics.hasActiveSession = async function(deviceFingerprint) {
  const session = await this.findOne({
    deviceFingerprint: deviceFingerprint,
    isActive: true
  });
  return !!session;
};

module.exports = mongoose.model('ClientSession', clientSessionSchema);
