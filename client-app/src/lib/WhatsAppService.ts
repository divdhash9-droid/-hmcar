// [[ARABIC_HEADER]] هذا الملف (client-app/src/lib/WhatsAppService.ts) جزء من مشروع HM CAR ويقوم بتوليد روابط واتساب احترافية.

/**
 * WhatsAppService - خدمة توليد روابط التواصل
 * تساعد في تحويل الزوار إلى عملاء حقيقيين عبر رسائل مجهزة مسبقاً.
 */

export const WhatsAppService = {
    /**
     * توليد رابط واتساب لسيارة محددة من المعرض الكوري أو المحلي
     */
    generateCarLink: (car: any, phoneNumber: string, isRTL: boolean, formatPrice?: (p: number) => string) => {
        if (!car) return '';
        
        const carTitle = car.title || car.model || 'سيارة من المعرض';
        const carMake = typeof car.make === 'object' ? car.make?.name : car.make;
        const price = formatPrice ? formatPrice(Number(car.price || 0)) : `${Number(car.price || 0).toLocaleString()} SAR`;

        const msg = isRTL
            ? `السلام عليكم HM CAR،\n\nأرغب في الاستفسار عن هذه السيارة:\n🚗 *${carTitle}*\n🛠️ الماركة: ${carMake}\n📅 الموديل: ${car.year || 'غير محدد'}\n💰 السعر: ${price}\n\nأرجو تزويدي بمزيد من التفاصيل.`
            : `Hello HM CAR,\n\nI'm interested in this vehicle:\n🚗 *${carTitle}*\n🛠️ Make: ${carMake}\n📅 Year: ${car.year || 'N/A'}\n💰 Price: ${price}\n\nPlease provide more details.`;

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    },

    /**
     * رابط عام لخدمة العملاء
     */
    getSupportLink: (phoneNumber: string, isRTL: boolean) => {
        const msg = isRTL 
            ? 'السلام عليكم، أحتاج إلى مساعدة بخصوص خدمات HM CAR.'
            : 'Hello, I need assistance regarding HM CAR services.';
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    }
};
