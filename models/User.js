// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // الاسم المعروض للمستخدم
  name: { type: String, trim: true, required: true },
  // مفتاح مبسط للاسم (يُستخدم لتسجيل دخول العميل بالاسم فقط)
  buyerNameKey: { type: String, unique: true, required: false, sparse: true },
  // رقم الهاتف (يُستخدم لحسابات الأدمن غالباً)
  phone: { type: String, unique: true, required: false, sparse: true },
  // البريد الإلكتروني (اختياري)
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
      'manage_users',        // إدارة المستخدمين
      'manage_settings',     // إدارة الإعدادات
      'manage_footer',       // إدارة الشريط السفلي
      'manage_whatsapp',     // إدارة رقم الواتساب
      'manage_cars',         // إدارة السيارات
      'manage_parts',        // إدارة قطع الغيار
      'manage_auctions',     // إدارة المزادات
      'view_analytics',      // عرض التحليلات
      'manage_content'       // إدارة المحتوى
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
  lockUntil: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  // تشفير كلمة المرور عند الإنشاء/التعديل فقط (إذا كانت password تم تعديلها)
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  // مقارنة كلمة مرور المستخدم المدخلة مع الـ hash المخزن
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// التحقق من قفل الحساب
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// زيادة محاولات الدخول الفاشلة
userSchema.methods.incLoginAttempts = function() {
  // إذا كان هناك قفل سابق وانتهى، نعيد تعيين المحاولات
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // قفل الحساب بعد 5 محاولات فاشلة لمدة 30 دقيقة
  const maxAttempts = 5;
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 دقيقة
  }
  
  return this.updateOne(updates);
};

// إعادة تعيين محاولات الدخول عند النجاح
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
