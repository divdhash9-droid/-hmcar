const SiteSettings = require('../models/SiteSettings');

class WhatsAppService {
  constructor() {
    this.defaultNumber = process.env.DEFAULT_WHATSAPP || '966500000000';
  }

  /**
   * الحصول على رقم الواتساب المعتمد (من القاعدة أو من المتغيرات)
   */
  async getActiveNumber() {
    try {
      const settings = await SiteSettings.getSettings();
      return settings?.socialLinks?.whatsapp || this.defaultNumber;
    } catch {
      return this.defaultNumber;
    }
  }

  /**
   * توليد رابط واتساب لسيارة محددة
   */
  async generateCarLink(car, customNumber = null) {
    const number = customNumber || await this.getActiveNumber();
    const baseUrl = 'https://wa.me/';
    
    const message = encodeURIComponent(
      `مرحباً HM CAR،\n\n` +
      `أنا مهتم بشراء هذه السيارة:\n` +
      `🚗 السيارة: ${car.title}\n` +
      `📅 الموديل: ${car.year}\n` +
      `💰 السعر: ${car.priceSar || car.price || '—'} ريال\n` +
      `🔗 الرابط: ${process.env.BASE_URL || 'https://car-auction-sand.vercel.app'}/cars/${car._id || car.id}\n\n` +
      `هل يمكنني الحصول على مزيد من التفاصيل حول حالة الفحص والشحن؟`
    );

    return `${baseUrl}${number.replace(/\+/g, '').replace(/\s/g, '')}?text=${message}`;
  }

  /**
   * توليد رابط واتساب عام للاستفسارات
   */
  async generateGeneralLink() {
    const number = await this.getActiveNumber();
    const message = encodeURIComponent(
      `مرحباً HM CAR،\n` +
      `أرغب في الاستفسار عن خدمات شراء وشحن السيارات من كوريا.`
    );
    return `https://wa.me/${number.replace(/\+/g, '').replace(/\s/g, '')}?text=${message}`;
  }
}

module.exports = new WhatsAppService();
