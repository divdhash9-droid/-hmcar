// نموذج الطلبات الخاصة (سيارة أو قطع غيار)

const mongoose = require('mongoose');

const conciergeRequestSchema = new mongoose.Schema({
    // نوع الطلب: car = طلب سيارة, parts = طلب قطعة غيار
    type: {
        type: String,
        enum: ['car', 'parts'],
        required: true,
        default: 'car'
    },

    // بيانات مشتركة
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    // بيانات طلب السيارة
    carName: { type: String, trim: true },       // اسم السيارة / الماركة
    model: { type: String, trim: true },          // الموديل
    color: { type: String, trim: true },          // اللون (hex)
    colorName: { type: String, trim: true },      // اسم اللون
    year: { type: String, trim: true },           // السنة

    // بيانات طلب القطع
    partName: { type: String, trim: true },       // اسم القطعة
    imageUrl: { type: String, trim: true },       // رابط صورة القطعة

    // وصف عام (مشترك)
    description: { type: String, trim: true },

    // مصدر الطلب (عام أو قادم من المعرض الكوري)
    source: {
        type: String,
        enum: ['general', 'korean_showroom'],
        default: 'general'
    },

    // رابط خارجي (مثلاً رابط السيارة الأصلي في Encar)
    externalUrl: { type: String, trim: true },

    // طريقة التواصل المفضلة من العميل
    contactPreference: {
        type: String,
        enum: ['whatsapp', 'chat', 'either'],
        default: 'whatsapp'
    },

    // حالة الطلب
    status: {
        type: String,
        enum: ['new', 'in_progress', 'completed', 'cancelled'],
        default: 'new'
    },

    // ملاحظات ومواعيد
    auctionDate: { type: Date },                 // موعد المزاد المحدد للعميل
    adminNotes: { type: String, trim: true },

}, { timestamps: true });

module.exports = mongoose.model('ConciergeRequest', conciergeRequestSchema);
