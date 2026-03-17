/**
 * مساعد تحويل العملات للطلبات (Order Currency Helper)
 * يوفر وظائف لحساب أسعار المنتجات في الطلبات بناءً على "لقطة" (Snapshot) لسعر الصرف
 * وقت إنشاء الطلب، لضمان استقرار الأسعار حتى لو تغيرت أسعار الصرف العالمية لاحقاً.
 */
export type CurrencyCode = 'SAR' | 'USD' | 'KRW';

interface ExchangeSnapshot {
    usdToSar?: number;
    usdToKrw?: number;
    activeCurrency?: CurrencyCode;
}

interface CurrencyRates {
    usdToSar?: number;
    usdToKrw?: number;
}

const toFiniteNumber = (value: unknown): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const getLocale = (currency: CurrencyCode) => {
    if (currency === 'USD') return 'en-US';
    if (currency === 'KRW') return 'ko-KR';
    return 'ar-SA';
};

const getSymbol = (currency: CurrencyCode) => {
    if (currency === 'USD') return '$';
    if (currency === 'KRW') return '₩';
    return 'ر.س';
};

/**
 * تحليل لقطة أسعار الصرف من بيانات الطلب
 * تستخرج أسعار الدولار مقابل الريال والوون التي كانت معتمدة وقت الطلب.
 */
export const resolveOrderSnapshot = (order: any, fallbackRates?: CurrencyRates): Required<ExchangeSnapshot> => {
    const snapshot = order?.pricing?.exchangeSnapshot || {};

    const usdToSar = toFiniteNumber(snapshot.usdToSar) || toFiniteNumber(fallbackRates?.usdToSar) || 3.75;
    const usdToKrw = toFiniteNumber(snapshot.usdToKrw) || toFiniteNumber(fallbackRates?.usdToKrw) || 1350;
    const active = String(snapshot.activeCurrency || 'SAR').toUpperCase();
    const activeCurrency: CurrencyCode = active === 'USD' || active === 'KRW' ? active : 'SAR';

    return {
        usdToSar,
        usdToKrw,
        activeCurrency,
    };
};

export const formatAmountWithSnapshot = (
    amountSar: number,
    targetCurrency: CurrencyCode,
    order: any,
    fallbackRates?: CurrencyRates
): string => {
    const snapshot = resolveOrderSnapshot(order, fallbackRates);
    const sar = toFiniteNumber(amountSar);
    const usd = sar / (snapshot.usdToSar || 1);

    let amount = sar;
    if (targetCurrency === 'USD') {
        amount = usd;
    } else if (targetCurrency === 'KRW') {
        amount = usd * snapshot.usdToKrw;
    }

    const formatter = new Intl.NumberFormat(getLocale(targetCurrency), {
        minimumFractionDigits: 0,
        maximumFractionDigits: targetCurrency === 'USD' ? 2 : 0,
    });

    return `${getSymbol(targetCurrency)} ${formatter.format(amount)}`;
};

export const getOrderGrandTotalSar = (order: any): number => {
    const pricingGrandTotal = toFiniteNumber(order?.pricing?.grandTotalSar);
    if (pricingGrandTotal > 0) return pricingGrandTotal;
    return toFiniteNumber(order?.totalAmount);
};

export const getOrderItemUnitSar = (item: any, order: any, fallbackRates?: CurrencyRates): number => {
    const unitSar = toFiniteNumber(item?.unitPriceSar);
    if (unitSar > 0) return unitSar;

    const unitUsd = toFiniteNumber(item?.unitPriceUsd);
    if (unitUsd > 0) {
        const snapshot = resolveOrderSnapshot(order, fallbackRates);
        return Number((unitUsd * snapshot.usdToSar).toFixed(2));
    }

    return 0;
};
