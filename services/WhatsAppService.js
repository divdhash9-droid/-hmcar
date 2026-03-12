// [[ARABIC_HEADER]] هذا الملف (services/WhatsAppService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * WhatsAppService - خدمة التواصل عبر الواتساب
 * مسؤولة عن توليد روابط التواصل المباشرة مع رسائل ذكية مخصصة لكل سيارة.
 */
class WhatsAppService {
  constructor() {
    this.defaultNumber = process.env.DEFAULT_WHATSAPP || '966500000000'; // رقم افتراضي في حال عدم وجود رقم في الإعدادات
  }

  /**
   * توليد رابط واتساب لسيارة محددة
   * @param {Object} car بيانات السيارة
   * @param {string} customNumber رقم محدد للمندوب (اختياري)
   */
  generateCarLink(car, customNumber = null) {
    const number = customNumber || this.defaultNumber;
    const baseUrl = 'https://wa.me/';
    
    // نص رسالة احترافي ومحفز للبيع
    const message = encodeURIComponent(
      `مرحباً HM CAR،\n\n` +
      `أنا مهتم بشراء هذه السيارة:\n` +
      `🚗 السيارة: ${car.title}\n` +
      `📅 الموديل: ${car.year}\n` +
      `💰 السعر: ${car.price} ريال\n` +
      `🔗 الرابط: ${process.env.BASE_URL}/cars/${car._id}\n\n` +
      `هل يمكنني الحصول على مزيد من التفاصيل حول حالة الفحص والشحن؟`
    );

    return `${baseUrl}${number.replace('+', '')}?text=${message}`;
  }

  /**
   * توليد رابط واتساب عام للاستفسارات
   */
  generateGeneralLink() {
    const message = encodeURIComponent(
      `مرحباً HM CAR،\n` +
      `أرغب في الاستفسار عن خدمات شراء وشحن السيارات من كوريا.`
    );
    return `https://wa.me/${this.defaultNumber.replace('+', '')}?text=${message}`;
  }
}

module.exports = new WhatsAppService();
