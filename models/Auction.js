// [[ARABIC_HEADER]] هذا الملف (models/Auction.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Auction.js
const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  // السيارة المرتبطة بالمزاد
  car: { type: mongoose.Schema.Types.ObjectId,ref: 'Car', required: true },
  // السعر الابتدائي
  startingPrice: { type: Number, required: true },
  // السعر الحالي (آخر مزايدة)
  currentPrice: { type: Number, default: 0 },
  // العملة الأساسية للمزاد
  currency: { type: String, enum: ['SAR', 'USD'], default: 'SAR' },
  // أعلى مزايد (مرجع مستخدم) - في هذا المشروع غالباً الأدمن عند الإدخال اليدوي
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // وقت البداية والنهاية
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  // حالة المزاد (تُحدث أيضاً في routes/auctions.js حسب الوقت)
  status: { type: String, enum: ['scheduled', 'running', 'ended'], default: 'scheduled' }
}, { timestamps: true });

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
auctionSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
auctionSchema.index({ car: 1 });
auctionSchema.index({ endsAt: 1 });

auctionSchema.methods.isActive = function() {
  // يتحقق إن كان المزاد ضمن الفترة الزمنية ولم يتم إغلاقه
  const now = new Date();
  return now >= this.startsAt && now <= this.endsAt && this.status !== 'ended';
};

module.exports = mongoose.model('Auction', auctionSchema);