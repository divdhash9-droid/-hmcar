// [[ARABIC_HEADER]] هذا الملف (models/Car.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Car.js
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  // مالك/بائع السيارة (عادة أدمن في هذا المشروع)
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true }, // مثال: Toyota Corolla 2018
  // نوع العرض: متجر أو سيارة مزاد
  listingType: { type: String, enum: ['store', 'auction'], default: 'store' },
  // رابط خارجي (يستخدم لسيارات المزاد الخارجية)
  externalUrl: { type: String, default: '' },
  // بيانات المركبة
  make: String,
  makeLogoUrl: String,
  model: String,
  year: Number,
  // تصنيف/فئة السيارة
  category: { type: String, default: 'sedan' }, // Changed to String for flexibility
  // السعر (price قديم) + سعر بالريال/الدولار
  price: Number,
  priceSar: Number,
  priceUsd: Number,
  mileage: Number,
  fuelType: { type: String, default: 'Petrol' },
  transmission: { type: String, default: 'Automatic' },
  color: String,
  // الحالة العامة
  condition: { type: String, enum: ['excellent', 'good', 'fair', 'needs work'], default: 'good' },
  description: String,
  images: [String], // مسارات الصور ضمن /uploads
  // حالة البيع
  isSold: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, // للتحكم في عرض السيارة
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  soldAt: { type: Date, default: null },
  // بيانات بيع معلّق (pendingSale) يتم إنشاؤها عند ضغط العميل شراء، ويؤكدها الأدمن لاحقاً
  pendingSaleToken: { type: String, default: '' },
  pendingSaleBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pendingSaleAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
