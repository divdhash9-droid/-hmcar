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
        const carLink = car.externalUrl || car.encarUrl || '';

        const msg = isRTL
            ? `السلام عليكم HM CAR،\n\nأرغب في شراء هذه السيارة:\n🚗 *${carTitle}*\n🛠️ الماركة: ${carMake}\n📅 الموديل: ${car.year || 'غير محدد'}\n🛣️ الممشى: ${car.mileage?.toLocaleString() || '0'} كم\n💰 السعر: ${price}\n🔗 الرابط: ${carLink}\n\nأرجو تزويدي بمزيد من التفاصيل لإتمام عملية الشراء.`
            : `Hello HM CAR,\n\nI'm interested in buying this vehicle:\n🚗 *${carTitle}*\n🛠️ Make: ${carMake}\n📅 Year: ${car.year || 'N/A'}\n🛣️ Mileage: ${car.mileage?.toLocaleString() || '0'} km\n💰 Price: ${price}\n🔗 Link: ${carLink}\n\nPlease provide more details to complete the purchase.`;

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    },

    /**
     * توليد رابط واتساب لمزاد محدد
     */
    generateAuctionLink: (auction: any, phoneNumber: string, isRTL: boolean, formatPrice?: (p: number) => string) => {
        if (!auction) return '';
        
        const title = auction.title || (auction.car ? `${auction.car.make} ${auction.car.model}` : 'مزاد سيارة');
        const price = formatPrice ? formatPrice(Number(auction.currentPrice || auction.startingPrice || 0)) : `${Number(auction.currentPrice || 0).toLocaleString()} SAR`;

        const msg = isRTL
            ? `السلام عليكم HM CAR،\n\nبخصوص المزاد القائم على:\n🔨 *${title}*\n💰 السعر الحالي: ${price}\n\nأرغب في الاستفسار عن تفاصيل المزايدة.`
            : `Hello HM CAR,\n\nRegarding the active auction for:\n🔨 *${title}*\n💰 Current Price: ${price}\n\nI have a question about the bidding process.`;

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
