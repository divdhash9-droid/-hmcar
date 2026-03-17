// [[ARABIC_HEADER]] هذا الملف (models/Car.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Car.js
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  // مالك/بائع السيارة (عادة أدمن في هذا المشروع)
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true }, // مثال: Toyota Corolla 2018
  // نوع العرض: متجر أو سيارة مزاد
  listingType: { type: String, enum: ['store', 'auction', 'showroom'], default: 'store' },
  // رابط خارجي (يستخدم لسيارات المزاد الخارجية)
  externalUrl: { type: String, default: '' },
  // مصدر السيارة لتطبيق الفصل التام بين مخزون HM المحلي والمعرض الكوري
  source: { type: String, enum: ['hm_local', 'korean_import'], default: 'hm_local', index: true },
  // الوكالة/البراند المرتبطة بالسيارة المحلية (اختياري)
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
  // بيانات المركبة
  make: String,
  makeLogoUrl: String,
  model: String,
  year: Number,
  // تصنيف/فئة السيارة
  category: { type: String, default: 'sedan' }, // Changed to String for flexibility
  // السعر (price قديم) + سعر بالريال/الدولار/الوون
  basePriceUsd: Number,
  price: Number,
  priceSar: Number,
  priceUsd: Number,
  priceKrw: Number,           // [[ARABIC_COMMENT]] السعر بالوون الكوري
  displayCurrency: { type: String, enum: ['SAR', 'USD', 'KRW'], default: 'SAR' }, // [[ARABIC_COMMENT]] العملة المعروضة للسيارة
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

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
carSchema.index({ isActive: 1, listingType: 1, createdAt: -1 });
carSchema.index({ make: 1, model: 1, year: -1 });
carSchema.index({ price: 1, priceUsd: 1 });
carSchema.index({ source: 1, isActive: 1 });
carSchema.index({ seller: 1 });
carSchema.index(
  { title: 'text', description: 'text' },
  { 
    weights: {
      title: 10,       // [[ARABIC_COMMENT]] إعطاء الأولوية القصوى للعنوان في نتائج البحث
      description: 2   // الوصف له أهمية أقل
    },
    name: "CarTextSearch"
  }
);

// ======== Hook: تفعيل التنبيهات الذكية عند إضافة سيارة جديدة ========
carSchema.post('save', function (doc) {
  // فقط عند إنشاء وثيقة جديدة (isNew=true عند أول save)
  if (this.wasNew) {
    try {
      const SmartAlertService = require('../services/SmartAlertService');
      SmartAlertService.checkNewCar(doc).catch(err =>
        console.error('[Car Model] خطأ في SmartAlert checkNewCar:', err.message)
      );
    } catch (err) {
      // تجاهل الخطأ إذا لم تكن الخدمة متاحة
    }
  }
});

// تخزين حالة isNew قبل الحفظ
carSchema.pre('save', function (next) {
  // [[ARABIC_COMMENT]] ضمان التوافق: توحيد source مع listingType للبيانات القديمة والجديدة
  if (!this.source) {
    this.source = this.listingType === 'showroom' ? 'korean_import' : 'hm_local';
  }
  if (!this.listingType) {
    this.listingType = this.source === 'korean_import' ? 'showroom' : 'store';
  }

  this.wasNew = this.isNew;
  next();
});

module.exports = mongoose.model('Car', carSchema);
