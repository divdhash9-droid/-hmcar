// [[ARABIC_HEADER]] نموذج إعدادات الموقع - روابط التواصل الاجتماعي والإعدادات العامة

const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    // مفتاح فريد للإعدادات (دائماً 'main')
    key: { type: String, default: 'main', unique: true },

    // روابط التواصل الاجتماعي
    socialLinks: {
        whatsapp: { type: String, default: '' },        // رقم الواتساب
        instagram: { type: String, default: '' },       // رابط انستغرام
        twitter: { type: String, default: '' },         // رابط تويتر/X
        facebook: { type: String, default: '' },        // رابط فيسبوك
        youtube: { type: String, default: '' },         // رابط يوتيوب
        tiktok: { type: String, default: '' },          // رابط تيك توك
        snapchat: { type: String, default: '' },        // رابط سناب شات
        telegram: { type: String, default: '' },        // رابط تليجرام
        linkedin: { type: String, default: '' },        // رابط لينكدإن
    },

    // معلومات الاتصال
    contactInfo: {
        phone: { type: String, default: '' },           // رقم الهاتف
        email: { type: String, default: '' },           // البريد الإلكتروني
        address: { type: String, default: '' },         // العنوان
        workingHours: { type: String, default: '' },    // ساعات العمل
    },

    // إعدادات الموقع العامة
    siteInfo: {
        siteName: { type: String, default: 'HM CAR' },
        siteDescription: { type: String, default: '' },
        logoUrl: { type: String, default: '' },
        faviconUrl: { type: String, default: '' },
    },

    // آخر تحديث
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

// دالة للحصول على الإعدادات (أو إنشاؤها إذا لم تكن موجودة)
siteSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ key: 'main' });
    if (!settings) {
        settings = await this.create({ key: 'main' });
    }
    return settings;
};

// دالة لتحديث الإعدادات
siteSettingsSchema.statics.updateSettings = async function (data, userId) {
    return await this.findOneAndUpdate(
        { key: 'main' },
        { ...data, updatedBy: userId },
        { new: true, upsert: true }
    );
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
