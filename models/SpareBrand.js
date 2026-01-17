// [[ARABIC_HEADER]] هذا الملف (models/SpareBrand.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const spareBrandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, unique: true, index: true },
  logoUrl: { type: String, default: '' },
  createdByFirebaseUid: { type: String, required: false, default: '' },
  updatedByFirebaseUid: { type: String, required: false, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SpareBrand', spareBrandSchema);
