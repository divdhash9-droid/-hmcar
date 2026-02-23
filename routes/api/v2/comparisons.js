// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/comparisons.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Comparison = require('../../../models/Comparison');
const Car = require('../../../models/Car');
const { requireAuthAPI } = require('../../../middleware/auth');

// الحصول على مقارنات المستخدم
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        const comparison = await Comparison.findOne({ user: userId })
            .populate({
                path: 'cars',
                select: 'title make model year price mileage fuelType transmission images'
            });

        res.json({
            success: true,
            data: comparison ? comparison.cars : []
        });
    } catch (error) {
        console.error('خطأ في جلب المقارنات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المقارنات' });
    }
});

// إضافة سيارة للمقارنة
router.post('/add', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { carId } = req.body;

        if (!carId) {
            return res.status(400).json({ success: false, error: 'معرف السيارة مطلوب' });
        }

        // التحقق من وجود السيارة
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ success: false, error: 'السيارة غير موجودة' });
        }

        let comparison = await Comparison.findOne({ user: userId });

        if (!comparison) {
            comparison = await Comparison.create({
                user: userId,
                cars: [carId]
            });
        } else {
            // التحقق من الحد الأقصى (4 سيارات)
            if (comparison.cars.length >= 4) {
                return res.status(400).json({
                    success: false,
                    error: 'الحد الأقصى للمقارنة هو 4 سيارات'
                });
            }

            // التحقق من عدم وجودها مسبقاً
            if (comparison.cars.includes(carId)) {
                return res.status(400).json({
                    success: false,
                    error: 'السيارة موجودة في المقارنة مسبقاً'
                });
            }

            comparison.cars.push(carId);
            await comparison.save();
        }

        res.json({
            success: true,
            message: 'تمت إضافة السيارة للمقارنة',
            data: { count: comparison.cars.length }
        });
    } catch (error) {
        console.error('خطأ في إضافة المقارنة:', error);
        res.status(500).json({ success: false, error: 'فشل في الإضافة' });
    }
});

// إزالة سيارة من المقارنة
router.delete('/remove/:carId', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { carId } = req.params;

        const comparison = await Comparison.findOne({ user: userId });

        if (!comparison) {
            return res.status(404).json({ success: false, error: 'لا توجد مقارنات' });
        }

        comparison.cars = comparison.cars.filter(c => c.toString() !== carId);
        await comparison.save();

        res.json({
            success: true,
            message: 'تمت إزالة السيارة من المقارنة',
            data: { count: comparison.cars.length }
        });
    } catch (error) {
        console.error('خطأ في إزالة المقارنة:', error);
        res.status(500).json({ success: false, error: 'فشل في الإزالة' });
    }
});

// مسح جميع المقارنات
router.delete('/clear', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        await Comparison.findOneAndDelete({ user: userId });

        res.json({
            success: true,
            message: 'تم مسح جميع المقارنات'
        });
    } catch (error) {
        console.error('خطأ في مسح المقارنات:', error);
        res.status(500).json({ success: false, error: 'فشل في المسح' });
    }
});

// مقارنة سيارات بدون تسجيل (بالـ IDs)
router.post('/compare', async (req, res) => {
    try {
        const { carIds } = req.body;

        if (!carIds || !Array.isArray(carIds) || carIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'يجب تحديد سيارتين على الأقل للمقارنة'
            });
        }

        if (carIds.length > 4) {
            return res.status(400).json({
                success: false,
                error: 'الحد الأقصى للمقارنة هو 4 سيارات'
            });
        }

        const cars = await Car.find({ _id: { $in: carIds } })
            .select('title make model year price mileage fuelType transmission color description images');

        res.json({
            success: true,
            data: cars
        });
    } catch (error) {
        console.error('خطأ في المقارنة:', error);
        res.status(500).json({ success: false, error: 'فشل في المقارنة' });
    }
});

module.exports = router;
