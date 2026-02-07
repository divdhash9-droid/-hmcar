// [[ARABIC_HEADER]] هذا الملف (models/SiteSetting.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

// إعدادات عامة للموقع تُخزن كـ Key/Value داخل قاعدة البيانات
// أمثلة مفاتيح مستخدمة في المشروع: liveAuctionUrl, customerWhatsAppNumber, customerBanners
const siteSettingSchema = new mongoose.Schema({
  // اسم الإعداد (مفتاح فريد)
  key: { type: String, unique: true, required: true },
  // قيمة الإعداد (نص) - قد تكون رابط/رقم/JSON
  value: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
