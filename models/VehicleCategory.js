// [[ARABIC_HEADER]] هذا الملف (models/VehicleCategory.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/VehicleCategory.js
const mongoose = require('mongoose');

const vehicleCategorySchema = new mongoose.Schema({
  // اسم الفئة (فريد) مثل: سيدان / SUV ...
  name: { type: String, required: true, unique: true, trim: true },
  // وصف اختياري للفئة
  description: { type: String },
  // صورة غلاف اختيارية للفئة (رابط/مسار)
  coverImage: { type: String }
  ,
  createdByFirebaseUid: { type: String, required: false, default: '' },
  updatedByFirebaseUid: { type: String, required: false, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('VehicleCategory', vehicleCategorySchema);
