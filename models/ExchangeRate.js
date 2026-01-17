// [[ARABIC_HEADER]] هذا الملف (models/ExchangeRate.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/ExchangeRate.js
const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  // سعر صرف الدولار مقابل الريال السعودي
  usdToSar: { 
    type: Number, 
    required: true, 
    default: 3.75,
    min: 0
  },
  // من قام بتحديث السعر
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  // تاريخ آخر تحديث
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  // ملاحظات
  notes: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true 
});

// قبل الحفظ: تحديث تاريخ آخر تعديل
exchangeRateSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
