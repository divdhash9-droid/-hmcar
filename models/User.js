// [[ARABIC_HEADER]] هذا الملف (models/User.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // الاسم المعروض للمستخدم
  name: { type: String, trim: true, required: true },
  // صورة الملف الشخصي (رابط محلي تحت /uploads أو رابط Cloudinary)
  avatar: { type: String, default: '' },
  // اسم المستخدم الفريد (يُستخدم لتسجيل الدخول بدلاً من الإيميل لزيادة الأمان)
  username: { type: String, unique: true, required: false, sparse: true, trim: true },
  // رقم الهاتف (يُستخدم لحسابات الأدمن غالباً)
  phone: { type: String, unique: true, required: false, sparse: true },
  // البريد الإلكتروني (اختياري، لا يُستخدم للدخول)
  email: { type: String, unique: true, required: false, lowercase: true, sparse: true },
  //معرف فايربيس
  firebaseUid: { type: String, unique: true, required: false, sparse: true },
  // كلمة المرور (تُخزن بعد عمل hash)
  password: { type: String, required: false },
  // الدور: buyer/admin/seller/super_admin/manager
  role: { type: String, enum: ['buyer', 'seller', 'admin', 'super_admin', 'manager'], default: 'buyer' },
  // الصلاحيات المحددة للمستخدم
  permissions: [{
    type: String,
    enum: [
      'manage_users',          // إدارة المستخدمين
      'manage_settings',       // إدارة الإعدادات
      'manage_footer',         // إدارة الشريط السفلي
      'manage_whatsapp',       // إدارة رقم الواتساب
      'manage_cars',           // إدارة السيارات
      'manage_parts',          // إدارة قطع الغيار
      'manage_auctions',       // إدارة المزادات
      'manage_concierge',      // إدارة طلبات الخاصة
      'manage_orders',         // إدارة الطلبيات
      'manage_brands',         // إدارة الوكالات
      'manage_messages',       // إدارة المحادثات
      'manage_notifications',  // إدارة الإشعارات
      'view_analytics',        // عرض التحليلات
      'manage_content',        // إدارة المحتوى
      'super_admin'            // صلاحيات كاملة (legacy)
    ]
  }],
  // معرف المشرف الذي أنشأ هذا المستخدم (للتتبع)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // حالة المستخدم (نشط/محظور)
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  // رقم الجلسة النشطة (استخدامه لمنع أكثر من جلسة للعميل)
  activeSessionId: { type: String, default: '' },
  // آخر وقت تسجيل دخول
  lastLoginAt: { type: Date, default: null },
  // محاولات الدخول الفاشلة
  loginAttempts: { type: Number, default: 0 },
  // وقت قفل الحساب
  lockUntil: { type: Date, default: null },
  // Two-Factor Authentication
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: '' },
  twoFactorBackupCodes: [{ type: String }],
  twoFactorEnabledAt: { type: Date, default: null },

  // Device Binding and Security
  deviceId: { type: String, default: '' },
  deviceBindingEnabled: { type: Boolean, default: true }, // خيار للأدمن لإلغاء تقييد الجهاز لهذا المستخدم
  lockoutCode: { type: String, default: '' }, // الرمز الذي يظهر للمستخدم عند الحظر ليقوم بإرساله للواتساب
  deviceInfo: {
    browser: String,
    os: String,
    userAgent: String,
    ip: String,
    lastAccessTime: { type: Date, default: Date.now }
  },
  boundDevices: [{
    deviceId: String,
    browser: String,
    os: String,
    ip: String,
    firstUsedAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    isTrusted: { type: Boolean, default: false } // Admin approval status
  }],
  isDeviceLocked: { type: Boolean, default: true }, // If true, new devices require admin approval or are blocked logic
  securityLevel: { type: String, enum: ['basic', 'standard', 'enhanced'], default: 'standard' },
  allowMultipleSessions: { type: Boolean, default: false },

  // IP Tracking
  registrationIP: { type: String, default: '' },     // IP عند التسجيل
  lastLoginIP: { type: String, default: '' },        // آخر IP تسجيل دخول

  // مفتاح اسم المشتري (Buyer Name Key) للعقود والتوثيق
  buyerNameKey: { type: String, unique: true, required: false, sparse: true },

  // How the account was created
  createdVia: {
    type: String,
    enum: ['manual', 'auto-registration', 'admin-created', 'api'],
    default: 'manual'
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  // تشفير كلمة المرور عند الإنشاء/التعديل فقط (إذا كانت password تم تعديلها)
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  // مقارنة كلمة مرور المستخدم المدخلة مع الـ hash المخزن
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// التحقق من قفل الحساب
userSchema.virtual('isLocked').get(function () {
  return !!(this.status === 'suspended' || (this.lockUntil && this.lockUntil > Date.now()));
});

// زيادة محاولات الدخول الفاشلة
userSchema.methods.incLoginAttempts = function () {
  // إذا كان هناك قفل سابق وانتهى، نعيد تعيين المحاولات
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1, lockoutCode: '' },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // قفل الحساب بعد 5 محاولات فاشلة
  // المستخدم طلب أن يظهر رمز ويحظر المستخدم
  const maxAttempts = 5;
  if (this.loginAttempts + 1 >= maxAttempts) {
    // توليد رمز عشوائي مكون من 6 أرقام وحروف
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    updates.$set = {
      status: 'suspended',
      lockoutCode: code,
      lockUntil: Date.now() + 24 * 60 * 60 * 1000 // قفل لمدة يوم أو حتى يفك الأدمن الحظر
    };
  }

  return this.updateOne(updates);
};

// إعادة تعيين محاولات الدخول عند النجاح
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lockoutCode: '' },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
