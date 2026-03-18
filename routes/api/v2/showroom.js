// [[ARABIC_HEADER]] مسار API للمعرض الكوري - يجلب سيارات من Encar.com ويُرجعها مترجمة

const express = require('express');
const router = express.Router();
const https = require('https');
const SiteSettings = require('../../../models/SiteSettings');
const Car = require('../../../models/Car');
const Brand = require('../../../models/Brand');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// ─────────────────────────────────────────────────────────
// قاموس الترجمة: كوري → عربي
// ─────────────────────────────────────────────────────────
const TRANSLATIONS = {
    // الشركات المصنّعة
    manufacturers: {
        '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس',
        '삼성': 'سامسونج', '쌍용': 'سانغ يونغ', 'BMW': 'بي إم دبليو',
        '벤츠': 'مرسيدس', '아우디': 'أودي', '폭스바겐': 'فولكس واغن',
        '볼보': 'فولفو', '렉서스': 'لكزس', '토요타': 'تويوتا',
        '혼다': 'هوندا', '닛산': 'نيسان', '쉐보레': 'شيفروليه',
        '포드': 'فورد', '지프': 'جيب', '랜드로버': 'لاند روفر',
        '포르쉐': 'بورش', '람보르기니': 'لامبورغيني', '페라리': 'فيراري',
        '롤스로이스': 'رولز رويس', '벤틀리': 'بنتلي', '마세라티': 'مازيراتي',
        '링컨': 'لينكولن', '캐딜락': 'كاديلاك', '미니': 'ميني',
        '인피니티': 'إنفينيتي', '아큐라': 'أكيورا', '볼보': 'فولفو',
    },
    // نوع الوقود
    fuelType: {
        '가솔린': 'بنزين', '디젤': 'ديزل', 'LPG': 'غاز (LPG)',
        '전기': 'كهربائي', '하이브리드': 'هايبرد', '플러그인 하이브리드': 'هايبرد قابل للشحن',
        '수소': 'هيدروجين', '가솔린+LPG': 'بنزين+غاز',
    },
    // ناقل الحركة
    transmission: {
        '오토': 'أوتوماتيك', '수동': 'يدوي', 'CVT': 'CVT',
        'DCT': 'DCT', 'A/T': 'أوتوماتيك', 'M/T': 'يدوي',
        '자동': 'أوتوماتيك',
    },
    // المناطق
    region: {
        '서울': 'سيول', '경기': 'كيونغي', '인천': 'إنتشون',
        '부산': 'بوسان', '대구': 'داغو', '광주': 'كوانغجو',
        '대전': 'داجون', '울산': 'أولسان', '세종': 'سيجونغ',
        '강원': 'كانغوون', '충북': 'تشونغبوك', '충남': 'تشونغنام',
        '전북': 'جيونبوك', '전남': 'جيونام', '경북': 'كيونغبوك',
        '경남': 'كيونغنام', '제주': 'جيجو',
    },
};

// ─────────────────────────────────────────────────────────
// دوال مساعدة
// ─────────────────────────────────────────────────────────

function convertEncarUrlToApi(encarUrl, page = 1) {
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    const buildApiUrl = (query) => {
        return `https://api.encar.com/search/car/list/mobile?count=true&q=${query}&sr=${encodeURIComponent(`|MobileModifiedDate|${offset}|${pageSize}`)}&inav=${encodeURIComponent('|Metadata|Sort')}&cursor=`;
    };

    const defaultApiUrl = buildApiUrl('(And.Hidden.N._.CarType.A.)');

    if (!encarUrl || typeof encarUrl !== 'string' || encarUrl.trim() === '') {
        return defaultApiUrl;
    }

    try {
        const url = new URL(encarUrl);
        const searchParam = url.searchParams.get('search');
        let query = 'CarType.A.';

        if (searchParam) {
            try {
                if (searchParam.includes('{')) {
                    const decoded = decodeURIComponent(searchParam);
                    const parsed = JSON.parse(decoded);
                    if (parsed.action) query = parsed.action;
                } else {
                    query = decodeURIComponent(decodeURIComponent(searchParam));
                }
            } catch (pErr) {
                if (searchParam.includes('And.')) query = decodeURIComponent(searchParam);
            }
        }

        query = query.replace(/^\(And\./, '').replace(/\)$/, '');
        query = query.replace(/^\((.*)\)$/, '$1');
        query = query.replace(/C\.CarType\.Y\./g, 'CarType.A.');

        if (!query.includes('CarType.A.')) {
            query = `CarType.A._.${query}`;
        }

        if (!query.trim()) query = 'CarType.A.';

        const finalQuery = `(And.Hidden.N._.${query})`;

        return buildApiUrl(finalQuery);
    } catch (err) {
        return defaultApiUrl;
    }
}

const axios = require('axios');

async function fetchExternal(url, redirectCount = 0) {
    if (redirectCount > 3) throw new Error('Too many redirects');

    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                'Referer': 'https://car.encar.com/',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
                'sec-ch-ua-mobile': '?0',
                'Cache-Control': 'no-cache',
            },
            timeout: 15000,
            maxRedirects: 3
        });
        return res.data;
    } catch (err) {
        throw new Error(`Failed external fetch: ${err.message}`);
    }
}

/** ترجمة بيانات السيارة من كوري إلى عربي واستخراج كافة التفاصيل والصور */
function translateCar(car) {
    const manufacturer = car.Manufacturer || '';
    const model = car.Model || '';
    const badge = car.Badge || '';
    const fuel = car.FuelType || car.Fuel || '';
    const transmission = car.Transmission || '';
    const region = car.Region || car.OfficeCityState || '';

    const translateTokens = (value = '') => {
        if (!value || typeof value !== 'string') return value;
        return value
            .replace(/하이브리드/g, 'هايبرد')
            .replace(/가솔린/g, 'بنزين')
            .replace(/디젤/g, 'ديزل')
            .replace(/전기/g, 'كهربائي')
            .replace(/오토/g, 'أوتوماتيك')
            .replace(/수동/g, 'يدوي')
            .replace(/신형/g, 'موديل جديد')
            .replace(/풀옵션/g, 'فل كامل')
            .replace(/무사고/g, 'بدون حوادث')
            .trim();
    };

    const manuAr = TRANSLATIONS.manufacturers[manufacturer] || manufacturer;
    const fuelAr = TRANSLATIONS.fuelType[fuel] || fuel;
    const transAr = TRANSLATIONS.transmission[transmission] || transmission;
    const regionAr = TRANSLATIONS.region[region] || region;

    // سعر السيارة بالوون (الوحدة: 만원 = 10,000 وون)
    const priceKrw = (car.Price || 0) * 10000;

    const normalizeImage = (value) => {
        if (!value) return null;
        let raw = '';
        if (typeof value === 'string') {
            raw = value;
        } else {
            // استخراج الرابط من كائنات الصور المختلفة التي ترجعها Encar
            raw = value.location || value.Location || value.url || value.Url || value.path || value.Path || value.PicUrl || '';
        }
        
        if (!raw || typeof raw !== 'string') return null;
        const trimmed = raw.trim();
        if (!trimmed) return null;

        // تنظيف الرابط وإضافة البروتوكول والنطاق إذا لزم الأمر
        if (trimmed.startsWith('http')) {
            return trimmed.endsWith('_') ? `${trimmed}001.jpg` : trimmed;
        }
        if (trimmed.endsWith('_')) {
            return `https://ci.encar.com${trimmed}001.jpg`;
        }
        if (trimmed.startsWith('/carpicture')) return `https://ci.encar.com${trimmed}`;
        if (trimmed.startsWith('/')) return `https://ci.encar.com/carpicture${trimmed}`;
        return `https://ci.encar.com/carpicture${trimmed}`;
    };

    // [[ARABIC_COMMENT]] استخراج كافة الصور المتاحة (Encar ترجع الصور في حقول متعددة أحياناً)
    const allEncarPhotos = [];
    
    // 1. من مصفوفة Photos أو Images العامة
    const standardPhotos = Array.isArray(car.Photos) ? car.Photos : (Array.isArray(car.Images) ? car.Images : []);
    standardPhotos.forEach(p => allEncarPhotos.push(normalizeImage(p)));

    // 2. من حقل PhotoList (مألوف في نسخ الجوال)
    if (Array.isArray(car.PhotoList)) {
        car.PhotoList.forEach(p => allEncarPhotos.push(normalizeImage(p)));
    }

    // 3. من الحقل الكوري 매물사진 (أعلى دقة أحياناً)
    const koreanPhotos = car?.Photo?.매물사진;
    if (Array.isArray(koreanPhotos)) {
        koreanPhotos.forEach(p => allEncarPhotos.push(normalizeImage(p)));
    }

    // 4. الصور الفردية وحقول الصور الممثلة
    const singlePhotos = [
        car.Photo, car.PhotoUrl, car.MainPhoto, car.MainImg, 
        car.ImageUrl, car.ImgUrl, car.PhotoPath, 
        car.RepresentativePhoto, car.RepresentativeImg
    ];
    singlePhotos.forEach(p => allEncarPhotos.push(normalizeImage(p)));

    // تنقية الصور المتكررة والقيم الفارغة
    const uniqueImages = [...new Set(allEncarPhotos.filter(Boolean))];

    const imageUrl = uniqueImages[0] || null;

    return {
        id: car.Id?.toString() || '',
        manufacturer: manufacturer,         // الاسم الكوري الأصلي
        manufacturerAr: manuAr,            // المترجم للعربية
        model: model,
        badge: badge,
        title: `${manuAr} ${translateTokens(model)} ${translateTokens(badge)}`.trim(),
        titleKr: `${manufacturer} ${model} ${badge}`.trim(),
        year: car.Year || 0,
        mileage: car.Mileage || 0,
        priceKrw: priceKrw,
        fuel: fuel,
        fuelAr: fuelAr,
        transmission: transmission,
        transmissionAr: transAr,
        region: region,
        regionAr: regionAr,
        imageUrl: imageUrl,
        images: uniqueImages, // الاحتفاظ بكافة الصور للاستفادة منها بالمعرض
        encarUrl: `https://car.encar.com/detail/car?carid=${car.Id}`,
        isInspected: !!(car.ServiceMark),
    };
}

// ─────────────────────────────────────────────────────────
// المسارات (Routes)
// ─────────────────────────────────────────────────────────

/**
 * GET /api/v2/showroom/cars
 * جلب سيارات المعرض الكوري (عام - للعملاء)
 * يستخدم الرابط المحفوظ في الإعدادات
 */
router.get('/cars', async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = 20;
        const skip = (page - 1) * limit;

        const showroomFilter = {
            isActive: true,
            isSold: false,
            $or: [
                { source: 'korean_import' },
                { source: { $exists: false }, listingType: 'showroom' }
            ]
        };

        const [cars, total] = await Promise.all([
            Car.find(showroomFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Car.countDocuments(showroomFilter)
        ]);

        const settings = await SiteSettings.getSettings();
        const showroomUrl = settings?.showroomSettings?.encarUrl || '';
        const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
        const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);

        const formattedCars = cars.map(car => ({
            id: car._id.toString(),
            manufacturer: car.make || '',
            manufacturerAr: car.make || '',
            model: car.model || '',
            badge: '',
            title: car.title || '',
            titleKr: car.title || '',
            year: car.year || 0,
            mileage: car.mileage || 0,
            priceKrw: car.priceKrw || Math.round((Number(car.priceUsd || 0) * usdToKrw)),
            priceUsd: Number(car.priceUsd || ((car.priceKrw || 0) / usdToKrw) || ((car.priceSar || car.price || 0) / usdToSar) || 0),
            priceSar: Number(car.priceSar || car.price || Math.round((Number(car.priceUsd || 0) * usdToSar))),
            fuel: car.fuelType || '',
            fuelAr: car.fuelType || '',
            transmission: car.transmission || '',
            transmissionAr: car.transmission || '',
            region: '',
            regionAr: '',
            imageUrl: (car.images && car.images[0] && String(car.images[0]).endsWith('_'))
                ? `https://ci.encar.com${String(car.images[0])}001.jpg`
                : (car.images && car.images[0]
                    ? car.images[0]
                    : 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop'),
            encarUrl: car.externalUrl || '',
            isInspected: true,
            images: car.images || [],
            price: car.price || car.priceSar || 0,
        }));

        const cleanedCars = formattedCars.map((c) => ({
            ...c,
            imageUrl: String(c.imageUrl || '').replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com'),
        }));

        res.json({
            success: true,
            data: cleanedCars,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            encarUrl: showroomUrl,
        });

    } catch (error) {
        console.error('❌ Showroom Error:', error.message);
        res.status(500).json({ success: false, message: 'فشل جلب سيارات المعرض' });
    }
});

/**
 * POST /api/v2/showroom/scrape
 * جلب السيارات من Encar وحفظها في قاعدة البيانات المحلية (للأدمن فقط)
 * يتم تحميل الصور وضغطها تلقائياً لتحسين سرعة الموقع
 */
router.post('/scrape', requireAuthAPI, requireAdmin, async (req, res) => {
    let apiUrl = '';
    try {
        const { downloadAndOptimize } = require('../../../services/externalImageService');
        const settings = await SiteSettings.getSettings();
        const showroomUrl = settings?.showroomSettings?.encarUrl || '';
        if (!showroomUrl) {
            return res.status(400).json({ success: false, message: 'لا يوجد رابط معرض محفوظ في الإعدادات.' });
        }

        const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
        const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);

        // جلب أول صفحتين فقط (حوالي 40 سيارة) لتجنب انتهاء وقت الطلب (Timeout)
        let totalCreated = 0;
        let totalUpdated = 0;
        
        // استخدام الصفحة المحفوظة لجلب بيانات جديدة كل مرة، والبدء بـ 1 إذا لم تكن موجودة
        let targetPage = Number(settings?.showroomSettings?.lastScrapedPage || 1);

        const urlWithPage = showroomUrl.replace(/page=\d+/, `page=${targetPage}`);
        apiUrl = convertEncarUrlToApi(urlWithPage, targetPage);

        let data;
        try {
            data = await fetchExternal(apiUrl);
        } catch (err) {
            console.warn(`[Showroom Scrape] Failed on page ${targetPage}: ${err.message}`);
            return res.status(500).json({ success: false, message: `فشل جلب البيانات من Encar: ${err.message}` });
        }

        const results = (data.SearchResults || []).map(translateCar);

            for (const item of results) {
                if (!item.encarUrl) continue;
                
                // حساب الأسعار بناءً على المعاملات المحددة في الإعدادات
                const auctionMultiplier = Number(settings?.currencySettings?.auctionMultiplier || 1.10);
                const computedUsd = Number(((item.priceKrw / usdToKrw) * auctionMultiplier).toFixed(2));
                const computedSar = Math.round(computedUsd * usdToSar);

                // [[ARABIC_COMMENT]] تخطي تحميل وتخزين الصور محلياً لتجنب انتهاء وقت دالة Serverless (Vercel Timeout)
                const finalImagesList = item.images || [];

                // التحقق من وجود السيارة مسبقاً
                const existingCar = await Car.findOne({ externalUrl: item.encarUrl });
                
                if (!existingCar) {
                    // [[ARABIC_COMMENT]] محاولة جلب شعار الماركة من قاعدة البيانات إذا توفرت
                    const brand = await Brand.findOne({ name: item.manufacturerAr });

                    await Car.create({
                        title: item.title,
                        make: item.manufacturerAr,
                        makeLogoUrl: brand ? brand.logoUrl : '',
                        model: item.model,
                        year: item.year,
                        mileage: item.mileage,
                        price: computedSar,
                        priceSar: computedSar,
                        priceUsd: computedUsd,
                        priceKrw: item.priceKrw,
                        fuelType: item.fuelAr,
                        transmission: item.transmissionAr,
                        color: '',
                        category: 'sedan',
                        listingType: 'showroom',
                        source: 'korean_import',
                        externalUrl: item.encarUrl,
                        images: finalImagesList,
                        isActive: true,
                        isSold: false,
                        displayCurrency: settings?.currencySettings?.defaultCurrency || 'SAR',
                        agency: brand ? brand._id : null
                    });
                    totalCreated++;
                } else {
                    // تحديث الأسعار والمواصفات (مع الحفاظ على البيانات التي قد يكون الأدمن عدلها)
                    existingCar.priceUsd = computedUsd;
                    existingCar.priceKrw = item.priceKrw;
                    existingCar.priceSar = computedSar;
                    existingCar.price = computedSar;
                    existingCar.source = 'korean_import';
                    existingCar.listingType = 'showroom';
                    
                    // تحديث الصور فقط إذا كانت القائمة الحالية ناقصة أو تالفة
                    const needsImageRepair = !Array.isArray(existingCar.images)
                        || existingCar.images.length < 3
                        || existingCar.images.some((img) => typeof img === 'string' && img.endsWith('_'));
                    
                    if (needsImageRepair && finalImagesList.length > 0) {
                        existingCar.images = finalImagesList;
                    }
                    
                    await existingCar.save();
                    totalUpdated++;
                }
            }

            // تحديث رقم الصفحة للعملية القادمة (أو تصفيره إذا وصلنا للنهاية)
            const nextPage = results.length < 20 ? 1 : targetPage + 1;
            await SiteSettings.findOneAndUpdate(
                { key: 'main' },
                { $set: { 'showroomSettings.lastScrapedPage': nextPage } },
                { upsert: true }
            );

        res.json({ success: true, message: `✅ اكتمل الجلب الذكي (الصفحة ${targetPage}): أُضيفت ${totalCreated} وحُدّثت ${totalUpdated} سيارة.` });
    } catch (error) {
        console.error('❌ Showroom Scrape Error:', error.message);
        res.status(500).json({ success: false, message: `فشل جلب البيانات وحفظها: ${error.message}` });
    }
});

/**
 * PUT /api/v2/showroom/settings
 * تحديث رابط Encar (للأدمن فقط)
 */
router.put('/settings', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const rawUrl = req.body?.encarUrl;
        const encarUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';

        if (!encarUrl || !encarUrl.includes('encar.com')) {
            return res.status(400).json({
                success: false,
                message: 'يجب أن يكون الرابط من موقع car.encar.com',
            });
        }

        const settings = await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: { 'showroomSettings.encarUrl': encarUrl } },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: '✅ تم تحديث رابط المعرض الكوري بنجاح',
            data: { encarUrl: settings.showroomSettings?.encarUrl },
        });
    } catch (error) {
        console.error('❌ Showroom settings error:', error.message);
        res.status(500).json({
            success: false,
            message: 'فشل تحديث رابط المعرض',
            error: error.message,
        });
    }
});

/**
 * GET /api/v2/showroom/settings
 * جلب إعدادات المعرض (للأدمن)
 */
router.get('/settings', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const settings = await SiteSettings.getSettings();
        res.json({
            success: true,
            data: {
                encarUrl: settings?.showroomSettings?.encarUrl || '',
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل جلب إعدادات المعرض' });
    }
});

module.exports = router;
