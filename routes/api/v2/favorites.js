// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/favorites.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Favorite = require('../../../models/Favorite');
const Car = require('../../../models/Car');
const { requireAuthAPI } = require('../../../middleware/auth');

// الحصول على جميع المفضلات للمستخدم الحالي
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        const favorites = await Favorite.find({ user: userId })
            .populate({
                path: 'car',
                select: 'title make model year price images listingType'
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: favorites.map(f => ({
                id: f._id,
                car: f.car,
                createdAt: f.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب المفضلات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المفضلات' });
    }
});

// التحقق من وجود سيارة في المفضلة
router.get('/check/:carId', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { carId } = req.params;

        const favorite = await Favorite.findOne({ user: userId, car: carId });

        res.json({
            success: true,
            isFavorite: !!favorite,
            favoriteId: favorite ? favorite._id : null
        });
    } catch (error) {
        console.error('خطأ في التحقق من المفضلة:', error);
        res.status(500).json({ success: false, error: 'فشل في التحقق' });
    }
});

// إضافة سيارة إلى المفضلة
router.post('/', requireAuthAPI, async (req, res) => {
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

        // التحقق من عدم وجودها مسبقاً
        const existing = await Favorite.findOne({ user: userId, car: carId });
        if (existing) {
            return res.status(400).json({ success: false, error: 'السيارة موجودة في المفضلة مسبقاً' });
        }

        const favorite = await Favorite.create({
            user: userId,
            car: carId
        });

        res.status(201).json({
            success: true,
            message: 'تمت الإضافة إلى المفضلة',
            data: { id: favorite._id }
        });
    } catch (error) {
        console.error('خطأ في إضافة المفضلة:', error);
        res.status(500).json({ success: false, error: 'فشل في الإضافة' });
    }
});

// حذف سيارة من المفضلة
router.delete('/:carId', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { carId } = req.params;

        const result = await Favorite.findOneAndDelete({ user: userId, car: carId });

        if (!result) {
            return res.status(404).json({ success: false, error: 'غير موجود في المفضلة' });
        }

        res.json({
            success: true,
            message: 'تمت الإزالة من المفضلة'
        });
    } catch (error) {
        console.error('خطأ في حذف المفضلة:', error);
        res.status(500).json({ success: false, error: 'فشل في الحذف' });
    }
});

// حذف جميع المفضلات
router.delete('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        await Favorite.deleteMany({ user: userId });

        res.json({
            success: true,
            message: 'تم مسح جميع المفضلات'
        });
    } catch (error) {
        console.error('خطأ في مسح المفضلات:', error);
        res.status(500).json({ success: false, error: 'فشل في المسح' });
    }
});

module.exports = router;
