// [[ARABIC_HEADER]] مسار API للمعرض الكوري - يجلب سيارات من Encar.com ويُرجعها مترجمة

const express = require('express');
const router = express.Router();
const https = require('https');
const SiteSettings = require('../../../models/SiteSettings');
const Car = require('../../../models/Car');
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

/** تحويل رابط Encar.com إلى رابط API */
function convertEncarUrlToApi(encarUrl, page = 1) {
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    // Verified working format from m.encar.com
    const defaultApiUrl = `https://api.encar.com/search/car/list/mobile?count=true&q=(And.Hidden.N._.(C.CarType.Y.))&sr=|MobileModifiedDate|${offset}|${pageSize}`;

    if (!encarUrl || typeof encarUrl !== 'string' || encarUrl.trim() === '') {
        return defaultApiUrl;
    }

    try {
        const url = new URL(encarUrl);
        const searchParam = url.searchParams.get('search');
        let query = '(C.CarType.Y)'; // Base car filter

        if (searchParam) {
            try {
                if (searchParam.includes('{')) {
                    const decoded = decodeURIComponent(searchParam);
                    const parsed = JSON.parse(decoded);
                    if (parsed.action) {
                        query = parsed.action;
                        // Remove outer And if it exists to wrap it in our own
                        query = query.replace(/^\(And\./, '').replace(/\)$/, '');
                    }
                } else {
                    query = decodeURIComponent(decodeURIComponent(searchParam));
                }
            } catch (pErr) {
                if (searchParam.includes('And.')) query = decodeURIComponent(searchParam);
            }
        }

        // Wrap in the format observed on the mobile site
        const finalQuery = `(And.Hidden.N._.(${query}))`;

        return `https://api.encar.com/search/car/list/mobile?count=true&q=${encodeURIComponent(finalQuery)}&sr=|MobileModifiedDate|${offset}|${pageSize}`;
    } catch (err) {
        return defaultApiUrl;
    }
}

function fetchExternal(url, redirectCount = 0) {
    if (redirectCount > 3) return Promise.reject(new Error('Too many redirects'));

    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
            },
            timeout: 10000
        };

        const req = https.get(url, options, (res) => {
            const { statusCode } = res;

            if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                return fetchExternal(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
            }

            if (statusCode !== 200) {
                res.resume();
                return reject(new Error(`Status ${statusCode}`));
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error('JSON Parse Error'));
                }
            });
        });

        req.on('error', (err) => reject(new Error(`Network: ${err.message}`)));
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

/** ترجمة بيانات السيارة من كوري إلى عربي */
function translateCar(car) {
    const manufacturer = car.Manufacturer || '';
    const model = car.Model || '';
    const badge = car.Badge || '';
    const fuel = car.Fuel || '';
    const transmission = car.Transmission || '';
    const region = car.Region || '';

    const manuAr = TRANSLATIONS.manufacturers[manufacturer] || manufacturer;
    const fuelAr = TRANSLATIONS.fuelType[fuel] || fuel;
    const transAr = TRANSLATIONS.transmission[transmission] || transmission;
    const regionAr = TRANSLATIONS.region[region] || region;

    // سعر السيارة بالوون (الوحدة: 만원 = 10,000 وون)
    const priceKrw = (car.Price || 0) * 10000;

    // [[ARABIC_COMMENT]] تصحيح منطق جلب الصور بناءً على هيكل استجابة Encar الجديد
    let imageUrl = null;
    if (typeof car.Photo === 'string' && car.Photo.length > 0) {
        // إذا كان رابطاً مباشراً أو مساراً يبدأ بـ /carpicture
        imageUrl = car.Photo.startsWith('http') ? car.Photo : `https://ci.encar.com/carpicture${car.Photo}`;
    } else if (car.Photo?.매물사진?.[0]?.PicFileNo) {
        // هيكل بديل/قديم
        const photoId = car.Photo.매물사진[0].PicFileNo;
        imageUrl = `https://ci.encar.com/carpicture/carpicture${photoId.substring(0, 2)}/pic${photoId.substring(0, 4)}/${photoId}_001.jpg`;
    }

    return {
        id: car.Id?.toString() || '',
        manufacturer: manufacturer,         // الاسم الكوري الأصلي
        manufacturerAr: manuAr,            // المترجم للعربية
        model: model,
        badge: badge,
        title: `${manuAr} ${model} ${badge}`.trim(),
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

        const [cars, total] = await Promise.all([
            Car.find({ listingType: 'showroom', isActive: true, isSold: false }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Car.countDocuments({ listingType: 'showroom', isActive: true, isSold: false })
        ]);

        const settings = await SiteSettings.getSettings();
        const showroomUrl = settings?.showroomSettings?.encarUrl || '';

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
            priceKrw: car.priceKrw || 0,
            fuel: car.fuelType || '',
            fuelAr: car.fuelType || '',
            transmission: car.transmission || '',
            transmissionAr: car.transmission || '',
            region: '',
            regionAr: '',
            imageUrl: car.images && car.images[0] ? car.images[0] : null,
            encarUrl: car.externalUrl || '',
            isInspected: true,
        }));

        res.json({
            success: true,
            data: formattedCars,
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
 */
router.post('/scrape', requireAuthAPI, requireAdmin, async (req, res) => {
    let apiUrl = '';
    try {
        const settings = await SiteSettings.getSettings();
        const showroomUrl = settings?.showroomSettings?.encarUrl || '';
        if (!showroomUrl) {
            return res.status(400).json({ success: false, message: 'لا يوجد رابط معرض محفوظ في الإعدادات.' });
        }

        // Only scrape first 3 pages (up to 60 cars) per call to prevent timeout
        let totalCreated = 0;
        let totalUpdated = 0;
        for (let page = 1; page <= 3; page++) {
            const urlWithPage = showroomUrl.replace(/page=\d+/, `page=${page}`);
            apiUrl = convertEncarUrlToApi(urlWithPage, page);

            let data;
            try {
                data = await fetchExternal(apiUrl);
            } catch (err) {
                console.warn(`[Showroom Scrape] Failed on page ${page}: ${err.message}`);
                break;
            }

            const results = (data.SearchResults || []).map(translateCar);

            for (const item of results) {
                if (!item.encarUrl) continue;
                // Check if car exists
                const existingCar = await Car.findOne({ externalUrl: item.encarUrl });
                if (!existingCar) {
                    await Car.create({
                        title: item.title,
                        make: item.manufacturerAr,
                        model: item.model,
                        year: item.year,
                        mileage: item.mileage,
                        price: 0,
                        priceSar: Math.round(item.priceKrw * 0.0028),
                        priceKrw: item.priceKrw,
                        fuelType: item.fuelAr,
                        transmission: item.transmissionAr,
                        color: '',
                        category: 'sedan',
                        listingType: 'showroom',
                        externalUrl: item.encarUrl,
                        images: item.imageUrl ? [item.imageUrl] : [],
                        isActive: true,
                        isSold: false,
                        displayCurrency: 'KRW'
                    });
                    totalCreated++;
                } else {
                    existingCar.priceKrw = item.priceKrw;
                    existingCar.priceSar = Math.round(item.priceKrw * 0.0028);
                    if (item.imageUrl && existingCar.images.length === 0) {
                        existingCar.images.push(item.imageUrl);
                    }
                    await existingCar.save();
                    totalUpdated++;
                }
            }

            // Stop if there are no more results on this page
            if (results.length < 20) break;
        }

        res.json({ success: true, message: `✅ اكتمل الجلب: أُضيفت ${totalCreated} وحُدّثت ${totalUpdated} سيارة بالمخزون.` });
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
        const { encarUrl } = req.body;

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
