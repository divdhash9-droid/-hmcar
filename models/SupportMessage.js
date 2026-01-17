// [[ARABIC_HEADER]] هذا الملف (models/SupportMessage.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  // اسم المرسل
  name: { type: String, required: true },
  // رقم هاتف المرسل
  phone: { type: String, required: true },
  // عنوان/موضوع الرسالة (اختياري)
  subject: { type: String, default: '' },
  // نص الرسالة
  message: { type: String, required: true },
  // حالة المعالجة من الإدارة
  status: { type: String, enum: ['new', 'responded'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
