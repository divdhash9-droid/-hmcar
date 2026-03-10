// [[ARABIC_HEADER]] مسار API للمعرض الكوري - يجلب سيارات من Encar.com ويُرجعها مترجمة

const express = require('express');
const router = express.Router();
const https = require('https');
const SiteSettings = require('../../../models/SiteSettings');
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
    const offset = (page - 1) * 20;
    const defaultApiUrl = `https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.A.)&sr=|MobileModifiedDate|${offset}|20`;

    if (!encarUrl || encarUrl.trim() === '') {
        return defaultApiUrl;
    }

    try {
        const url = new URL(encarUrl);
        const searchParam = url.searchParams.get('search');
        let query = '(And.Hidden.N._.CarType.A.)';

        if (searchParam) {
            try {
                // Handle different formats of search param
                if (searchParam.startsWith('{')) {
                    const parsed = JSON.parse(decodeURIComponent(searchParam));
                    if (parsed.action) query = parsed.action;
                } else {
                    // It might be the query string itself
                    query = decodeURIComponent(searchParam);
                }
            } catch (pErr) {
                console.warn('[Showroom] Failed to parse search param JSON:', pErr.message);
                // Try treating it as raw query if it looks like one
                if (searchParam.includes('And.')) query = searchParam;
            }
        }

        // Simpler API call without the heavy 'inav' parameter to avoid 400 errors
        return `https://api.encar.com/search/car/list/general?count=true&q=${encodeURIComponent(query)}&sr=|MobileModifiedDate|${offset}|20`;
    } catch (err) {
        console.warn('[Showroom] Invalid encarUrl provided:', encarUrl);
        return defaultApiUrl;
    }
}

/** جلب بيانات من URL خارجي */
function fetchExternal(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.encar.com/',
                'Origin': 'https://www.encar.com',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            timeout: 15000 // 15 seconds timeout
        };

        const req = https.get(url, options, (res) => {
            const { statusCode } = res;

            if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                console.log(`[Showroom] Redirect detected: ${statusCode} -> ${res.headers.location}`);
                return fetchExternal(res.headers.location).then(resolve).catch(reject);
            }

            if (statusCode !== 200) {
                res.resume();
                return reject(new Error(`Encar API returned status ${statusCode}`));
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                }
                catch (e) {
                    console.error('[Showroom] JSON Parse Error. Data length:', data.length);
                    if (data.includes('Access Denied') || data.includes('Cloudflare')) {
                        reject(new Error('Bot protection detected (WAF/Cloudflare)'));
                    } else {
                        reject(new Error('Invalid JSON response from Encar'));
                    }
                }
            });
        });

        req.on('error', (err) => {
            console.error('[Showroom] Network Error:', err.message);
            reject(new Error(`Network Error: ${err.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Encar API request timed out (15s)'));
        });
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

    // رابط الصورة من Encar CDN
    const photoId = car.Photo?.매물사진?.[0]?.PicFileNo || '';
    const imageUrl = photoId
        ? `https://ci.encar.com/cars_new_img/${photoId.substring(0, 4)}/${photoId}_001.jpg`
        : null;

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

        // جلب رابط Encar من إعدادات الموقع
        const settings = await SiteSettings.getSettings();
        const showroomUrl = settings?.showroomSettings?.encarUrl ||
            'https://car.encar.com/list/car?page=1&search=%7B%22type%22%3A%22car%22%2C%22action%22%3A%22(And.Hidden.N._.CarType.A.)%22%2C%22sort%22%3A%22MobileModifiedDate%22%7D';

        // تحويل رابط الصفحة إلى رابط API مع الصفحة المطلوبة
        const urlWithPage = showroomUrl.replace(/page=\d+/, `page=${page}`);
        const apiUrl = convertEncarUrlToApi(urlWithPage);

        console.log(`[Showroom] Fetching from: ${apiUrl}`);

        // جلب البيانات من Encar
        const data = await fetchExternal(apiUrl);

        const results = (data.SearchResults || []).map(translateCar);

        res.json({
            success: true,
            data: results,
            total: data.Count || results.length,
            page: page,
            totalPages: Math.ceil((data.Count || results.length) / 20),
            encarUrl: showroomUrl, // الرابط الأصلي للمرجع
        });

    } catch (error) {
        console.error('❌ Showroom fetch error:', error.message);
        res.status(500).json({
            success: false,
            message: `فشل جلب سيارات المعرض: ${error.message}`,
            debug: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
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
