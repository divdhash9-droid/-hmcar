// [[ARABIC_HEADER]] هذا الملف (models/AuthSettings.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const authSettingsSchema = new mongoose.Schema({
  // نظام المصادقة الرئيسي
  authenticationEnabled: {
    type: Boolean,
    default: true,
    description: 'تفعيل/إيقاف نظام المصادقة'
  },
  
  // تسجيل الدخول المتعدد
  allowMultipleLogins: {
    type: Boolean,
    default: false,
    description: 'السماح بتسجيل الدخول المتعدد لنفس المستخدم'
  },
  
  // التحقق من البريد الإلكتروني
  requireEmailVerification: {
    type: Boolean,
    default: false,
    description: 'التحقق من البريد الإلكتروني'
  },
  
  // التحقق من الجهاز
  requireDeviceVerification: {
    type: Boolean,
    default: false,
    description: 'التحقق من بصمة الجهاز'
  },
  
  // تسجيل الدخول التلقائي
  autoLoginEnabled: {
    type: Boolean,
    default: false,
    description: 'تسجيل الدخول التلقائي'
  },
  
  // وضع التطوير
  developmentMode: {
    type: Boolean,
    default: false,
    description: 'وضع التطوير (تجاوز المصادقة)'
  },
  
  // قائمة المستخدمين المسموح لهم في وضع التطوير
  developmentUsers: [{
    type: String,
    description: 'قائمة المستخدمين المسموح لهم في وضع التطوير'
  }],
  
  // إعدادات الأمان
  maxLoginAttempts: {
    type: Number,
    default: 5,
    description: 'الحد الأقصى لمحاولات تسجيل الدخول'
  },
  
  lockoutDuration: {
    type: Number,
    default: 15,
    description: 'مدة الحظر بالدقائق'
  },
  
  // تسجيل الدخول بدون كلمة مرور
  allowPasswordlessLogin: {
    type: Boolean,
    default: false,
    description: 'السماح بتسجيل الدخول بدون كلمة مرور'
  },

  // مدة تذكرني بالأيام
  rememberMeDays: {
    type: Number,
    default: 30,
    description: 'مدة تذكرني بالأيام'
  },
  
  // المستخدمون الذين يمكنهم التحكم في المصادقة
  authControllers: [{
    type: String,
    default: ['superadmin@localhost.com', 'admin@localhost.com'],
    description: 'المستخدمون الذين يمكنهم التحكم في المصادقة'
  }],
  
  // سجل التغييرات
  changeLog: [{
    changedBy: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Methods
authSettingsSchema.methods.isAuthenticationEnabled = function() {
  return this.authenticationEnabled && !this.developmentMode;
};

authSettingsSchema.methods.canBypassAuth = function(userEmail) {
  return this.developmentMode && this.developmentUsers.includes(userEmail);
};

authSettingsSchema.methods.isAuthController = function(userEmail) {
  return this.authControllers.includes(userEmail);
};

authSettingsSchema.methods.logChange = function(changedBy, field, oldValue, newValue, ipAddress, userAgent) {
  this.changeLog.push({
    changedBy,
    field,
    oldValue,
    newValue,
    ipAddress,
    userAgent
  });
  return this.save();
};

// Static methods
authSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

authSettingsSchema.statics.updateSetting = async function(field, value, changedBy, ipAddress, userAgent) {
  const settings = await this.getSettings();
  const oldValue = settings[field];
  
  settings[field] = value;
  await settings.logChange(changedBy, field, oldValue, value, ipAddress, userAgent);
  
  return settings.save();
};

module.exports = mongoose.model('AuthSettings', authSettingsSchema);
