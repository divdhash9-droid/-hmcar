// models/SparePart.js
const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  // اسم القطعة
  name: { type: String, required: true, trim: true },
  // نوع القطعة (مثال: مكابح/فلتر...)
  partType: { type: String, trim: true },
  spareBrand: { type: mongoose.Schema.Types.ObjectId, ref: 'SpareBrand', default: null },
  // بيانات المركبة المستهدفة (اختياري)
  carMake: { type: String, trim: true },
  carMakeLogoUrl: { type: String, trim: true },
  carModel: { type: String, trim: true },
  carYear: { type: Number },
  // السعر (قديم/أساسي) + أسعار متعددة عملات (إن وجدت)
  price: { type: Number, required: true },
  priceSar: { type: Number },
  priceUsd: { type: Number },
  // وصف وصور
  description: { type: String },
  images: [String],
  // المخزون
  stockQty: { type: Number, default: 0, min: 0 },
  inStock: { type: Boolean, default: true }
  ,
  createdByFirebaseUid: { type: String, required: false, default: '' },
  updatedByFirebaseUid: { type: String, required: false, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SparePart', sparePartSchema);
