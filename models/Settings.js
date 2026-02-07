// [[ARABIC_HEADER]] هذا الملف (models/Settings.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // إعدادات الواتساب
  whatsapp: {
    phoneNumber: { type: String, default: '+966500000001' },
    message: { type: String, default: 'أهلاً بك! نحن هنا لمساعدتك.' },
    enabled: { type: Boolean, default: true }
  },
  
  // إعدادات الشريط السفلي
  footer: {
    title: { type: String, default: 'HM CAR Auction' },
    description: { type: String, default: 'أفضل منصة للمزادات السيارات في المملكة' },
    links: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      icon: { type: String, default: 'fas fa-link' },
      order: { type: Number, default: 0 }
    }],
    socialMedia: [{
      platform: { type: String, enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'] },
      url: { type: String, required: true },
      icon: { type: String, default: 'fab fa-facebook' },
      order: { type: Number, default: 0 }
    }],
    contactInfo: {
      email: { type: String, default: 'info@hmcar.com' },
      phone: { type: String, default: '+966500000001' },
      address: { type: String, default: 'الرياض، المملكة العربية السعودية' }
    },
    // روابط التواصل الاجتماعي المباشرة
    facebookUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' }
  },

  // إعدادات عامة
  general: {
    siteName: { type: String, default: 'HM CAR Auction' },
    siteDescription: { type: String, default: 'منصة متخصصة في مزادات السيارات وقطع الغيار' },
    logo: { type: String, default: '/images/logo.png' },
    favicon: { type: String, default: '/favicon.ico' },
    maintenance: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'الموقع تحت الصيانة. سنعود قريباً.' }
  }
}, { timestamps: true });

// إنشاء سجل واحد فقط للإعدادات
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
