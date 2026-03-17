// [[ARABIC_HEADER]] هذا الملف (models/Order.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

// عنصر داخل الطلب: يمثل سيارة أو قطعة غيار أو فوز مزاد
const orderItemSchema = new mongoose.Schema({
  // نوع العنصر
  itemType: { type: String, enum: ['car', 'sparePart', 'auctionWin'], required: true },
  // معرف العنصر في مجموعته (Car/SparePart)
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  // Snapshot لاسم العنصر وقت إنشاء الطلب (حتى لو تغير الاسم لاحقاً)
  titleSnapshot: { type: String, required: true },
  // الكمية
  qty: { type: Number, default: 1, min: 1 },
  // سعر الوحدة بالريال/الدولار (قد يكون أحدهما فقط)
  unitPriceSar: { type: Number, default: null },
  unitPriceUsd: { type: Number, default: null }
}, { _id: false });

// سجل تغييرات حالة الطلب (Audit Trail)
const orderStatusHistorySchema = new mongoose.Schema({
  // الحالة السابقة
  from: { type: String, default: '' },
  // الحالة الجديدة
  to: { type: String, required: true },
  // الأدمن الذي غيّر الحالة
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // وقت التغيير
  at: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // رقم الطلب (فريد) بصيغة HM-YYYY-XXXXXX
  orderNumber: { type: String, required: true, unique: true, index: true },
  // المشتري صاحب الطلب
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // حالة الطلب
  // - pending: قيد الانتظار
  // - confirmed: تم التأكيد (الشراء من كوريا)
  // - processing: قيد التجهيز (للشحن)
  // - shipped_sea: مشحونة في البحر
  // - customs_clearance: قيد التخليص الجمركي
  // - arrived: وصلت (جاهزة للاستلام)
  // - completed: مكتملة
  // - cancelled: ملغاة
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped_sea', 'customs_clearance', 'arrived', 'completed', 'cancelled'], default: 'pending' },
  // قناة الطلب (حالياً واتساب)
  channel: { type: String, enum: ['whatsapp'], default: 'whatsapp' },
  // عناصر الطلب
  items: { type: [orderItemSchema], default: [] },
  // ملخص الأسعار (للدعم متعدد العملات)
  pricing: {
    subTotalSar: { type: Number, default: 0 },
    subTotalUsd: { type: Number, default: 0 },
    shippingSar: { type: Number, default: 0 },
    shippingUsd: { type: Number, default: 0 },
    grandTotalSar: { type: Number, default: 0 },
    grandTotalUsd: { type: Number, default: 0 },
    exchangeSnapshot: {
      usdToSar: { type: Number, default: 3.75 },
      usdToKrw: { type: Number, default: 1350 },
      activeCurrency: { type: String, enum: ['SAR', 'USD', 'KRW'], default: 'SAR' },
      capturedAt: { type: Date, default: Date.now }
    }
  },
  // تاريخ تغيير الحالة
  statusHistory: { type: [orderStatusHistorySchema], default: [] },
  // ملاحظات داخلية
  notes: { type: String, default: '' },
  meta: {
    // بيانات إضافية خاصة بتأكيد بيع سيارة (pendingSale)
    pendingSaleToken: { type: String, default: '' },
    pendingSaleConfirmUrl: { type: String, default: '' },
    // علامة لمنع خصم المخزون أكثر من مرة
    inventoryDeducted: { type: Boolean, default: false }
  }
}, { timestamps: true });

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'meta.pendingSaleToken': 1 });

module.exports = mongoose.model('Order', orderSchema);
