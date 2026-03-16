// [[ARABIC_HEADER]] نموذج إعدادات الموقع - روابط التواصل الاجتماعي والإعدادات العامة

const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    // مفتاح فريد للإعدادات (دائماً 'main')
    key: { type: String, default: 'main', unique: true },

    // روابط التواصل الاجتماعي
    socialLinks: {
        whatsapp: { type: String, default: '+967781007805' },        // رقم الواتساب
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

    // إعدادات العملة والصرف
    currencySettings: {
        usdToSar: { type: Number, default: 3.75 },       // سعر صرف الدولار مقابل الريال السعودي
        usdToKrw: { type: Number, default: 1350 },       // سعر صرف الدولار مقابل الوون الكوري
        activeCurrency: { type: String, default: 'SAR' }, // العملة الافتراضية للعرض
        partsMultiplier: { type: Number, default: 1.0 },  // معامل ضرب سعر القطع
        auctionMultiplier: { type: Number, default: 1.0 }, // معامل ضرب سعر المزاد
    },

    // محتوى الصفحة الرئيسية الديناميكي (لماذا تختارنا)
    features: [{
        icon: { type: String, default: 'Shield' },      // اسم الأيقونة من Lucide
        title: { type: String, required: true },        // العنوان (عربي)
        titleEn: { type: String, default: '' },         // العنوان (إنجليزي)
        desc: { type: String, required: true },         // الوصف (عربي)
        descEn: { type: String, default: '' },          // الوصف (إنجليزي)
    }],

    // محتوى إضافي
    homeContent: {
        heroTitle: String,
        heroSubtitle: String,
        heroVideoUrl: String,
        showSearchSection: { type: Boolean, default: true },
        showLiveMarket: { type: Boolean, default: true },
        showTrustHub: { type: Boolean, default: true },
        showAdvertising: { type: Boolean, default: true },
        showBuyingJourney: { type: Boolean, default: true },
        showPlatformFeatures: { type: Boolean, default: true },
        showBrandCatalog: { type: Boolean, default: true },
        showTrustedBy: { type: Boolean, default: true },
        showTestimonials: { type: Boolean, default: true },
        showAppConversion: { type: Boolean, default: true },
        showFAQ: { type: Boolean, default: true },
    },

    // إعدادات المعرض الكوري
    showroomSettings: {
        encarUrl: { type: String, default: '' }, // رابط البحث من Encar.com
    },

    // ── إعدادات الإعلانات الديناميكية ──
    // يتحكم الأدمن من هنا بما يظهر في الشريط الإعلاني بالصفحة الرئيسية
    advertisingSettings: {
        // المزاد المباشر: هل يظهر في الشريط الإعلاني؟
        showLiveAuction: { type: Boolean, default: false },

        // نوع مصدر سيارات المعرض: 'none' | 'korean' | 'hmcar' | 'both'
        showroomSource: { type: String, default: 'none' },

        // نص شعار الشريط الإعلاني (اختياري)
        bannerLabel: { type: String, default: '' },
        bannerLabelEn: { type: String, default: '' },
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
