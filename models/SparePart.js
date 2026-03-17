// [[ARABIC_HEADER]] هذا الملف (models/SparePart.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/SparePart.js
const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  // اسم القطعة
  name: { type: String, required: true, trim: true },
  nameAr: { type: String, trim: true },
  // نوع القطعة (مثال: مكابح/فلتر...)
  partType: { type: String, trim: true },
  partTypeAr: { type: String, trim: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null }, // Unified Brand
  // بيانات المركبة المستهدفة (اختياري)
  carMake: { type: String, trim: true },
  carMakeLogoUrl: { type: String, trim: true },
  carModel: { type: String, trim: true },
  carYear: { type: Number },
  // السعر (قديم/أساسي) + أسعار متعددة عملات 
  basePriceUsd: { type: Number },
  price: { type: Number, required: true },
  priceSar: { type: Number },
  priceUsd: { type: Number },
  priceKrw: { type: Number },
  // وصف وصور
  description: { type: String },
  images: [String],
  externalUrl: { type: String, trim: true },
  source: { type: String, trim: true, default: 'manual' },
  // المخزون
  stockQty: { type: Number, default: 0, min: 0 },
  inStock: { type: Boolean, default: true },
  createdByFirebaseUid: { type: String, required: false, default: '' },
  updatedByFirebaseUid: { type: String, required: false, default: '' }
}, { timestamps: true });

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
sparePartSchema.index(
  { name: 'text', nameAr: 'text', carMake: 'text', carModel: 'text' },
  {
    weights: {
      name: 10,
      nameAr: 10,
      carMake: 3,
      carModel: 3
    },
    name: "SparePartTextSearch"
  }
);
sparePartSchema.index({ carMake: 1, carModel: 1, carYear: -1 });
sparePartSchema.index({ inStock: 1, price: 1 });
sparePartSchema.index({ brand: 1 });

module.exports = mongoose.model('SparePart', sparePartSchema);
