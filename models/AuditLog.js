// [[ARABIC_HEADER]] هذا الملف (models/AuditLog.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // المستخدم الذي قام بالعملية
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // نوع العملية
  action: {
    type: String,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT',
      'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'RESET_PASSWORD',
      'UPLOAD', 'DOWNLOAD', 'BACKUP', 'RESTORE', 'SYSTEM_CHANGE'
    ],
    required: true
  },
  // الكائن المستهدف
  target: {
    type: String,
    enum: [
      'User', 'Car', 'Auction', 'Bid', 'Order', 'Payment', 'Report',
      'Settings', 'Brand', 'SparePart', 'Category', 'Notification',
      'SupportMessage', 'System', 'Database', 'File'
    ],
    required: true
  },
  // معرف الكائن المستهدف
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  // وصف العملية
  description: {
    type: String,
    required: true,
    trim: true
  },
  // البيانات قبل التغيير
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // البيانات بعد التغيير
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // عنوان IP
  ipAddress: {
    type: String,
    required: true
  },
  // معلومات المتصفح
  userAgent: {
    type: String,
    required: true
  },
  // الجلسة
  sessionId: {
    type: String,
    required: true
  },
  // النتيجة
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PARTIAL'],
    default: 'SUCCESS'
  },
  // رسالة الخطأ (إذا فشلت العملية)
  errorMessage: {
    type: String,
    default: null
  },
  // مدة العملية بالمللي ثانية
  duration: {
    type: Number,
    default: 0
  },
  // الأهمية
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  // الفئة
  category: {
    type: String,
    enum: [
      'SECURITY', 'DATA_MANAGEMENT', 'USER_MANAGEMENT', 'SYSTEM',
      'FINANCIAL', 'CONTENT', 'COMMUNICATION', 'BACKUP', 'PERFORMANCE'
    ],
    default: 'SYSTEM'
  },
  // العلامات للبحث والتصفية
  tags: [{
    type: String,
    trim: true
  }],
  // معلومات إضافية
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ target: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ result: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ tags: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index - حذف السجلات القديمة بعد سنة
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static methods
auditLogSchema.statics.log = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // لا نرمي خطأ لتجنب إيقاف العمليات الرئيسية
  }
};

auditLogSchema.statics.logUserAction = async function(user, action, target, description, additionalData = {}) {
  return this.log({
    user: (user && user._id) ? user._id : user,
    action,
    target,
    description,
    ipAddress: additionalData.ipAddress || '0.0.0.0',
    userAgent: additionalData.userAgent || 'Unknown',
    sessionId: additionalData.sessionId || 'unknown',
    before: additionalData.before,
    after: additionalData.after,
    targetId: additionalData.targetId,
    result: additionalData.result || 'SUCCESS',
    errorMessage: additionalData.errorMessage,
    duration: additionalData.duration,
    severity: additionalData.severity || 'MEDIUM',
    category: additionalData.category || 'SYSTEM',
    tags: additionalData.tags || [],
    metadata: additionalData.metadata || {}
  });
};

auditLogSchema.statics.logSystemEvent = async function(action, description, severity = 'MEDIUM', metadata = {}) {
  return this.log({
    user: null, // System event
    action,
    target: 'System',
    description,
    ipAddress: '0.0.0.0',
    userAgent: 'System',
    sessionId: 'system',
    severity,
    category: 'SYSTEM',
    metadata
  });
};

// Instance methods
auditLogSchema.methods.isCritical = function() {
  return this.severity === 'CRITICAL';
};

auditLogSchema.methods.isSecurityRelated = function() {
  return this.category === 'SECURITY' || 
         ['LOGIN', 'LOGOUT', 'SUSPEND', 'ACTIVATE', 'RESET_PASSWORD'].includes(this.action);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
