// [[ARABIC_HEADER]] هذا الملف (models/SmartAlert.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * models/SmartAlert.js
 * نموذج التنبيهات الذكية
 *
 * يسمح للمستخدم بتحديد معايير بحث معينة، وعند إضافة سيارة جديدة تطابق تلك المعايير
 * يتلقى المستخدم تنبيهاً فورياً عبر الإشعارات داخل التطبيق.
 */

const mongoose = require('mongoose');

const smartAlertSchema = new mongoose.Schema({
    // المستخدم صاحب التنبيه
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // اسم التنبيه (يختاره المستخدم، مثال: "أبحث عن كورولا 2020")
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    // ======== معايير المطابقة ========
    criteria: {
        // الماركة (مثال: Toyota)
        make: { type: String, default: '' },

        // الموديل (مثال: Corolla)
        model: { type: String, default: '' },

        // نطاق السنة
        yearMin: { type: Number, default: null },
        yearMax: { type: Number, default: null },

        // نطاق السعر (بالريال السعودي)
        priceMin: { type: Number, default: null },
        priceMax: { type: Number, default: null },

        // نوع الوقود
        fuelType: { type: String, default: '' }, // Petrol, Diesel, Electric, Hybrid

        // ناقل الحركة
        transmission: { type: String, default: '' }, // Automatic, Manual

        // فئة السيارة
        category: { type: String, default: '' }, // sedan, suv, truck, etc.

        // الحالة
        condition: { type: String, default: '' }, // excellent, good, fair

        // نوع الإدراج
        listingType: { type: String, default: '' } // store, auction, ''=all
    },

    // ======== إعدادات التنبيه ========
    // هل التنبيه نشط؟
    isActive: { type: Boolean, default: true },

    // قنوات الإشعار
    channels: {
        inApp: { type: Boolean, default: true },   // داخل التطبيق
        email: { type: Boolean, default: false },   // بريد إلكتروني
    },

    // تكرار التنبيه: immediate=فوري، daily=يومي
    frequency: {
        type: String,
        enum: ['immediate', 'daily'],
        default: 'immediate'
    },

    // ======== إحصائيات ========
    // عدد مرات تفعيل هذا التنبيه
    triggerCount: { type: Number, default: 0 },

    // آخر مرة تم فيه إرسال تنبيه
    lastTriggeredAt: { type: Date, default: null },

    // آخر سيارة أطلقت التنبيه (لتجنب التكرار)
    lastTriggeredCarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        default: null
    },

    // قائمة السيارات التي أُرسل عنها تنبيه بالفعل (لتجنب التكرار)
    notifiedCarIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    }]

}, { timestamps: true });

// فهرسة للبحث السريع
smartAlertSchema.index({ user: 1, isActive: 1 });
smartAlertSchema.index({ isActive: 1 });

// حد أقصى 10 تنبيهات لكل مستخدم
smartAlertSchema.statics.countForUser = async function (userId) {
    return await this.countDocuments({ user: userId });
};

module.exports = mongoose.model('SmartAlert', smartAlertSchema);
