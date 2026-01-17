// [[ARABIC_HEADER]] هذا الملف (models/Bid.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Bid.js
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  // مرجع السيارة المرتبط بهذه المزايدة
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  // مرجع المستخدم الذي أدخل المزايدة
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // اسم معروض للمزايد (اختياري) يظهر في الواجهة
  displayName: { type: String, default: '' },
  // مبلغ المزايدة
  amount: { type: Number, required: true },
  // تاريخ المزايدة
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);