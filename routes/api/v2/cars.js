// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/cars.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Car = require('../../../models/Car');
const AuditLog = require('../../../models/AuditLog');
const SiteSettings = require('../../../models/SiteSettings');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');
const SmartAlertService = require('../../../services/SmartAlertService');
const { cacheResponse, invalidateCache } = require('../../../middleware/cache');

function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function normalizeCarPricing(payload, rates) {
    const usdToSar = Number(rates?.usdToSar || 3.75);
    const usdToKrw = Number(rates?.usdToKrw || 1350);

    const candidateUsd = toFiniteNumber(payload.basePriceUsd || payload.priceUsd || payload.usdPrice);
    const candidateSar = toFiniteNumber(payload.priceSar || payload.price);
    const candidateKrw = toFiniteNumber(payload.priceKrw || payload.krwPrice);

    let basePriceUsd = candidateUsd;
    if (!basePriceUsd && candidateKrw > 0) basePriceUsd = candidateKrw / usdToKrw;
    if (!basePriceUsd && candidateSar > 0) basePriceUsd = candidateSar / usdToSar;

    const normalizedUsd = Number(basePriceUsd.toFixed(2));
    const normalizedSar = Number((normalizedUsd * usdToSar).toFixed(2));
    const normalizedKrw = Math.round(normalizedUsd * usdToKrw);

    const source = payload?.source === 'korean_import'
        ? 'korean_import'
        : (payload?.source === 'hm_local' ? 'hm_local' : (payload?.listingType === 'showroom' ? 'korean_import' : 'hm_local'));
    const listingType = payload?.listingType || (source === 'korean_import' ? 'showroom' : 'store');

    return {
        ...payload,
        source,
        listingType,
        basePriceUsd: normalizedUsd,
        priceUsd: normalizedUsd,
        priceSar: normalizedSar,
        priceKrw: normalizedKrw,
        price: normalizedSar,
    };
}

// GET /api/v2/cars - جلب قائمة السيارات
router.get('/', cacheResponse(300), async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            make,
            minPrice,
            maxPrice,
            search,
            status = 'active',
            listingType,
            source
        } = req.query;

        // بناء الفلتر
        const conditions = [];

        if (status === 'active') {
            conditions.push({ isActive: true, isSold: false });
        } else if (status === 'sold') {
            conditions.push({ isSold: true });
        } else if (status === 'inactive') {
            conditions.push({ isActive: false });
        }

        if (category) conditions.push({ category });
        if (make) conditions.push({ make });

        if (listingType) {
            if (listingType === 'store') {
                conditions.push({
                    $or: [
                        { listingType: 'store' },
                        { listingType: { $exists: false } },
                        { listingType: null },
                        { listingType: '' }
                    ]
                });
            } else {
                conditions.push({ listingType });
            }
        }

        if (source === 'hm_local') {
            conditions.push({
                $or: [
                    { source: 'hm_local' },
                    {
                        source: { $exists: false },
                        $or: [
                            { listingType: 'store' },
                            { listingType: 'auction' },
                            { listingType: { $exists: false } },
                            { listingType: null },
                            { listingType: '' }
                        ]
                    }
                ]
            });
        } else if (source === 'korean_import') {
            conditions.push({
                $or: [
                    { source: 'korean_import' },
                    { source: { $exists: false }, listingType: 'showroom' }
                ]
            });
        }

        if (minPrice || maxPrice) {
            const priceCond = { $or: [] };
            if (minPrice) {
                priceCond.$or.push({ price: { $gte: Number(minPrice) } });
                priceCond.$or.push({ priceSar: { $gte: Number(minPrice) } });
            }
            if (maxPrice) {
                // [[ARABIC_COMMENT]] إذا كان هناك minPrice مسبقاً، نحتاج لإضافة $lte لشروط الـ $or الموجودة
                if (priceCond.$or.length > 0) {
                    priceCond.$or[0].price = { ...priceCond.$or[0].price, $lte: Number(maxPrice) };
                    priceCond.$or[1].priceSar = { ...priceCond.$or[1].priceSar, $lte: Number(maxPrice) };
                } else {
                    priceCond.$or.push({ price: { $lte: Number(maxPrice) } });
                    priceCond.$or.push({ priceSar: { $lte: Number(maxPrice) } });
                }
            }
            conditions.push(priceCond);
        }

        if (search) {
            // [[ARABIC_COMMENT]] بحث ذكي - يدعم الأخطاء الإملائية والمصطلحات العربية والإنجليزية
            const s = search.trim();

            // [[ARABIC_COMMENT]] خريطة تحويل أسماء الماركات عربي → إنجليزي
            const arabicBrandMap = {
                'تويوتا': 'toyota', 'تيوتا': 'toyota', 'تتويوتا': 'toyota',
                'نيسان': 'nissan', 'نيزان': 'nissan',
                'هوندا': 'honda', 'حوندا': 'honda',
                'مرسيدس': 'mercedes', 'مرسديس': 'mercedes', 'مرسيدز': 'mercedes',
                'بي ام دبليو': 'bmw', 'بي ام': 'bmw', 'بمو': 'bmw',
                'لكزس': 'lexus', 'لكسس': 'lexus',
                'انفينيتي': 'infiniti', 'انفنتي': 'infiniti',
                'كيا': 'kia', 'هيونداي': 'hyundai', 'هيونداى': 'hyundai',
                'فورد': 'ford', 'شيفروليه': 'chevrolet', 'شيفروليت': 'chevrolet',
                'بورش': 'porsche', 'بورشه': 'porsche',
                'رنج روفر': 'range rover', 'لاند روفر': 'land rover',
                'جيب': 'jeep', 'دودج': 'dodge', 'رام': 'ram',
                'اودي': 'audi', 'أودي': 'audi', 'فولكسواجن': 'volkswagen',
                'سوبارو': 'subaru', 'مازدا': 'mazda', 'ميتسوبيشي': 'mitsubishi',
                'جيلي': 'geely', 'بي ام جي': 'byd', 'شانجان': 'changan',
                'فيراري': 'ferrari', 'لامبورغيني': 'lamborghini', 'بنتلي': 'bentley',
                'رولز رويس': 'rolls royce', 'ماكلارين': 'mclaren',
            };

            // [[ARABIC_COMMENT]] تحويل النص العربي إلى إنجليزي إن وُجد في الخريطة
            const lowerS = s.toLowerCase();
            const mappedSearchEn = arabicBrandMap[s] || arabicBrandMap[lowerS] || null;

            // [[ARABIC_COMMENT]] تحقق من تشابه النص (ليفنشتاين بسيط) للسماح بالأخطاء الإملائية
            const fuzzyTokens = s.split(/\s+/).filter(t => t.length > 1);

            const searchConditions = [
                { title: { $regex: s, $options: 'i' } },
                { make: { $regex: s, $options: 'i' } },
                { model: { $regex: s, $options: 'i' } },
                { description: { $regex: s, $options: 'i' } },
            ];

            // [[ARABIC_COMMENT]] إضافة شروط اللغة الإنجليزية المقابلة للماركة العربية
            if (mappedSearchEn) {
                searchConditions.push({ make: { $regex: mappedSearchEn, $options: 'i' } });
                searchConditions.push({ title: { $regex: mappedSearchEn, $options: 'i' } });
            }

            // [[ARABIC_COMMENT]] بحث على كل كلمة منفردة (fuzzy tokens)
            fuzzyTokens.forEach(token => {
                if (token !== s) {
                    searchConditions.push({ make: { $regex: token, $options: 'i' } });
                    searchConditions.push({ title: { $regex: token, $options: 'i' } });
                    searchConditions.push({ model: { $regex: token, $options: 'i' } });
                }
            });

            conditions.push({ $or: searchConditions });
        }

        const filter = conditions.length > 0 ? { $and: conditions } : {};

        // Pagination
        const skip = (page - 1) * limit;

        const [cars, total] = await Promise.all([
            Car.find(filter)
                .populate('agency')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Car.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                cars: cars.map(car => ({
                    id: car._id,
                    title: car.title,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    price: car.price || car.priceSar || (car.priceUsd ? car.priceUsd * 3.75 : 0) || 0,
                    priceSar: car.priceSar || car.price || (car.priceUsd ? car.priceUsd * 3.75 : 0) || 0,
                    priceUsd: car.priceUsd || (car.priceSar ? car.priceSar / 3.75 : 0) || 0,
                    basePriceUsd: car.basePriceUsd || car.priceUsd || (car.priceSar ? car.priceSar / 3.75 : 0) || 0,
                    priceKrw: car.priceKrw || 0,
                    displayCurrency: car.displayCurrency || 'SAR',
                    images: car.images || [],
                    category: car.category,
                    isActive: car.isActive,
                    isSold: car.isSold,
                    createdAt: car.createdAt,
                    color: car.color,
                    fuelType: car.fuelType,
                    transmission: car.transmission,
                    mileage: car.mileage,
                    description: car.description,
                    listingType: car.listingType,
                    source: car.source || (car.listingType === 'showroom' ? 'korean_import' : 'hm_local'),
                    agency: car.agency || null

                })),
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/cars/makes - جلب قائمة الماركات
router.get('/makes', cacheResponse(1800), async (req, res, next) => {
    try {
        const includeInactive = String(req.query.includeInactive || 'false') === 'true';
        const filter = includeInactive ? {} : { isActive: true, isSold: false };

        const makes = await Car.distinct('make', filter);
        const cleaned = makes
            .map(m => (typeof m === 'string' ? m.trim() : m))
            .filter(Boolean)
            .sort((a, b) => String(a).localeCompare(String(b)));

        res.json({ success: true, data: cleaned });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/cars/:id - جلب تفاصيل سيارة محددة
router.get('/:id', cacheResponse(600), async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id)
            .populate('agency')
            .lean();

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Car not found'
            });
        }

        res.json({
            success: true,
            data: car
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v2/cars - إضافة سيارة جديدة (Admin only)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const settings = await SiteSettings.getSettings();
        const payload = normalizeCarPricing(req.body, settings?.currencySettings);
        const car = new Car(payload);
        await car.save();

        // Log car creation
        await AuditLog.logUserAction(
            req.user.userId,
            'CREATE',
            'Car',
            `Created new car: ${car.title}`,
            {
                targetId: car._id,
                after: car.toObject(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api'
            }
        );

        // تفعيل التنبيهات الذكية بشكل غير متزامن (لا يؤخر الاستجابة)
        SmartAlertService.checkNewCar(car).catch(err =>
            console.error('[SmartAlert] خطأ في checkNewCar:', err.message)
        );

        res.status(201).json({
            success: true,
            data: car,
            message: 'Car created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v2/cars/:id - تحديث سيارة (Admin only)
router.put('/:id', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const oldCar = await Car.findById(req.params.id);
        if (!oldCar) {
            return res.status(404).json({
                success: false,
                error: 'Car not found'
            });
        }

        const settings = await SiteSettings.getSettings();
        const mergedPayload = {
            ...oldCar.toObject(),
            ...req.body,
        };
        const normalizedPayload = normalizeCarPricing(mergedPayload, settings?.currencySettings);
        delete normalizedPayload._id;
        delete normalizedPayload.__v;
        delete normalizedPayload.createdAt;
        delete normalizedPayload.updatedAt;

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            normalizedPayload,
            { new: true, runValidators: true }
        );

        // Log car update
        await AuditLog.logUserAction(
            req.user.userId,
            'UPDATE',
            'Car',
            `Updated car: ${car.title}`,
            {
                targetId: car._id,
                before: oldCar ? oldCar.toObject() : null,
                after: car.toObject(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api'
            }
        );

        res.json({
            success: true,
            data: car,
            message: 'Car updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v2/cars/:id - حذف سيارة (Admin only)
router.delete('/:id', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Car not found'
            });
        }

        res.json({
            success: true,
            message: 'Car deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// [[ARABIC_COMMENT]] PATCH /api/v2/cars/:id/sold - تعليم السيارة كـ "تم البيع" (أدمن فقط)
// [[ARABIC_COMMENT]] بعد التنفيذ: isSold=true + isActive=false → تختفي من المعرض فوراً
router.patch('/:id/sold', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const { soldPrice, buyerNote } = req.body;

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            {
                isSold: true,
                isActive: false,
                soldAt: new Date(),
                soldPrice: soldPrice || undefined,
                buyerNote: buyerNote || undefined,
            },
            { new: true }
        );

        if (!car) {
            return res.status(404).json({ success: false, error: 'Car not found' });
        }

        // [[ARABIC_COMMENT]] تسجيل في AuditLog للتقارير التلقائية
        try {
            await AuditLog.create({
                action: 'SOLD',
                targetModel: 'Car',
                description: `تم بيع السيارة: ${car.title}`,
                targetId: car._id,
                after: { isSold: true, soldAt: car.soldAt, soldPrice: car.soldPrice },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api'
            });
        } catch (logErr) {
            console.error('AuditLog error:', logErr);
        }

        res.json({
            success: true,
            data: car,
            message: 'تم تحديث السيارة كـ "مباعة" بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
