// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/cars.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Car = require('../../../models/Car');
const AuditLog = require('../../../models/AuditLog');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');
const SmartAlertService = require('../../../services/SmartAlertService');

// GET /api/v2/cars - جلب قائمة السيارات
router.get('/', async (req, res) => {
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
            listingType
        } = req.query;

        // بناء الفلتر
        const filter = {};

        if (status === 'active') {
            filter.isActive = true;
            filter.isSold = false;
        } else if (status === 'sold') {
            filter.isSold = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }

        if (category) filter.category = category;
        if (make) filter.make = make;
        if (listingType) {
            if (listingType === 'store') {
                // [[ARABIC_COMMENT]] جلب سيارات المعرض بما فيها السيارات التي لا تملك قيمة listingType (التوافق مع القديم)
                filter.listingType = { $in: ['store', null, undefined, ''] };
            } else {
                filter.listingType = listingType;
            }
        }

        if (minPrice || maxPrice) {
            filter.$or = [
                { price: {} },
                { priceSar: {} }
            ];
            if (minPrice) {
                filter.$or[0].price.$gte = Number(minPrice);
                filter.$or[1].priceSar.$gte = Number(minPrice);
            }
            if (maxPrice) {
                filter.$or[0].price.$lte = Number(maxPrice);
                filter.$or[1].priceSar.$lte = Number(maxPrice);
            }
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { make: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;

        const [cars, total] = await Promise.all([
            Car.find(filter)
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
                    price: car.price || car.priceSar || 0,
                    images: car.images || [],
                    category: car.category,
                    isActive: car.isActive,
                    isSold: car.isSold,
                    createdAt: car.createdAt,
                    color: car.color,
                    fuelType: car.fuelType,
                    transmission: car.transmission,
                    mileage: car.mileage,
                    description: car.description
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
        console.error('Get cars error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

// GET /api/v2/cars/:id - جلب تفاصيل سيارة محددة
router.get('/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).lean();

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
        console.error('Get car details error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

// POST /api/v2/cars - إضافة سيارة جديدة (Admin only)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_cars'), async (req, res) => {
    try {
        const car = new Car(req.body);
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
        console.error('Create car error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

// PUT /api/v2/cars/:id - تحديث سيارة (Admin only)
router.put('/:id', requireAuthAPI, requirePermissionAPI('manage_cars'), async (req, res) => {
    try {
        const oldCar = await Car.findById(req.params.id);
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Car not found'
            });
        }

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
        console.error('Update car error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

// DELETE /api/v2/cars/:id - حذف سيارة (Admin only)
router.delete('/:id', requireAuthAPI, requirePermissionAPI('manage_cars'), async (req, res) => {
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
        console.error('Delete car error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

module.exports = router;
