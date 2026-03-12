// [[ARABIC_HEADER]] هذا الملف (models/Brand.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Brand.js
const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  // اسم الشركة/الماركة المعروض للمستخدم
  name: { type: String, required: true, trim: true },
  // مفتاح فريد (عادة lowercase) لاستخدامه في البحث والربط
  key: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // رابط/مسار شعار الشركة
  logoUrl: { type: String, default: '' },
  // Flags for unified brand management
  forCars: { type: Boolean, default: true },
  forSpareParts: { type: Boolean, default: false },
  // Models belonging to this brand
  models: { type: [String], default: [] },
  // Agency Profile Info (for cars)
  targetShowroom: { type: String, enum: ['hm_local', 'korean_import', 'both'], default: 'hm_local' },
  isActive: { type: Boolean, default: true },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  description: { type: String, default: '' },
  description_ar: { type: String, default: '' },
  createdByFirebaseUid: { type: String, required: false, default: '' },
  updatedByFirebaseUid: { type: String, required: false, default: '' }
}, { timestamps: true });

brandSchema.pre('validate', function (next) {
  // تجهيز key تلقائياً من name إن لم يُرسل
  if (!this.key && this.name) {
    this.key = String(this.name).trim().toLowerCase();
  }
  // ضمان التطبيع (lowercase/trim)
  if (this.key) this.key = String(this.key).trim().toLowerCase();
  if (this.name) this.name = String(this.name).trim();
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
