// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/reviews.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Review = require('../../../models/Review');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// الحصول على جميع التقييمات المعتمدة
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ status: 'approved' })
                .populate('user', 'name')
                .populate('car', 'title make model')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments({ status: 'approved' })
        ]);

        res.json({
            success: true,
            data: reviews.map(r => ({
                id: r._id,
                rating: r.rating,
                comment: r.comment,
                user: r.user ? { name: r.user.name } : null,
                car: r.car,
                createdAt: r.createdAt
            })),
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('خطأ في جلب التقييمات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب التقييمات' });
    }
});

// الحصول على تقييمات سيارة معينة
router.get('/car/:carId', async (req, res) => {
    try {
        const { carId } = req.params;

        const reviews = await Review.find({ car: carId, status: 'approved' })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.json({
            success: true,
            data: {
                reviews: reviews.map(r => ({
                    id: r._id,
                    rating: r.rating,
                    comment: r.comment,
                    user: r.user ? { name: r.user.name } : null,
                    createdAt: r.createdAt
                })),
                stats: {
                    count: reviews.length,
                    averageRating: Math.round(avgRating * 10) / 10
                }
            }
        });
    } catch (error) {
        console.error('خطأ في جلب تقييمات السيارة:', error);
        res.status(500).json({ success: false, error: 'فشل في الجلب' });
    }
});

// إضافة تقييم جديد
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { carId, rating, comment } = req.body;

        if (!carId || !rating) {
            return res.status(400).json({ success: false, error: 'معرف السيارة والتقييم مطلوبان' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'التقييم يجب أن يكون بين 1 و 5' });
        }

        // التحقق من عدم وجود تقييم سابق
        const existing = await Review.findOne({ user: userId, car: carId });
        if (existing) {
            return res.status(400).json({ success: false, error: 'لديك تقييم سابق لهذه السيارة' });
        }

        const review = await Review.create({
            user: userId,
            car: carId,
            rating,
            comment: comment || '',
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'تم إرسال التقييم وسيتم مراجعته',
            data: { id: review._id }
        });
    } catch (error) {
        console.error('خطأ في إضافة التقييم:', error);
        res.status(500).json({ success: false, error: 'فشل في الإضافة' });
    }
});

// تحديث حالة التقييم (للأدمن)
router.patch('/:id/status', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'حالة غير صالحة' });
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, error: 'التقييم غير موجود' });
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة التقييم',
            data: { id: review._id, status: review.status }
        });
    } catch (error) {
        console.error('خطأ في تحديث التقييم:', error);
        res.status(500).json({ success: false, error: 'فشل في التحديث' });
    }
});

// حذف تقييم
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { id } = req.params;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

        const query = isAdmin ? { _id: id } : { _id: id, user: userId };
        const review = await Review.findOneAndDelete(query);

        if (!review) {
            return res.status(404).json({ success: false, error: 'التقييم غير موجود' });
        }

        res.json({
            success: true,
            message: 'تم حذف التقييم'
        });
    } catch (error) {
        console.error('خطأ في حذف التقييم:', error);
        res.status(500).json({ success: false, error: 'فشل في الحذف' });
    }
});

// الحصول على جميع التقييمات (للأدمن)
router.get('/admin/all', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = status !== 'all' ? { status } : {};

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user', 'name email')
                .populate('car', 'title make model')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('خطأ في جلب التقييمات:', error);
        res.status(500).json({ success: false, error: 'فشل في الجلب' });
    }
});

module.exports = router;
