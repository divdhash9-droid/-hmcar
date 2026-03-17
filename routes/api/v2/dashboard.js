// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/dashboard.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Car = require('../../../models/Car');
const Auction = require('../../../models/Auction');
const Order = require('../../../models/Order');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/dashboard/client - بيانات لوحة تحكم العميل
router.get('/client', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;

        // جلب الإحصائيات
        const [
            availableCars,
            liveAuctions,
            myOrders,
            pendingOrders,
            recentCars,
            myFavorites
        ] = await Promise.all([
            // عدد السيارات المتاحة
            Car.countDocuments({ isActive: true, isSold: false }),

            // عدد المزادات المباشرة
            Auction.countDocuments({ status: 'running' }),

            // عدد طلباتي
            Order.countDocuments({ buyer: userId }),

            // الطلبات قيد المعالجة
            Order.countDocuments({
                buyer: userId,
                status: { $in: ['pending', 'confirmed'] }
            }),

            // أحدث السيارات (6 سيارات)
            Car.find({ isActive: true, isSold: false })
                .sort({ createdAt: -1 })
                .limit(6)
                .select('title make model year price priceSar priceUsd priceKrw images category')
                .lean(),

            // المفضلة (إذا كان هناك نموذج للمفضلة)
            // Favorite.countDocuments({ user: userId })
            0 // مؤقتاً
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    availableCars,
                    liveAuctions,
                    myOrders,
                    pendingOrders,
                    myFavorites
                },
                recentCars: recentCars.map(car => ({
                    id: car._id.toString(), // [[ARABIC_COMMENT]] تحويل ObjectId إلى string لضمان صحة الروابط
                    title: car.title,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    price: car.price || car.priceSar || (car.priceUsd ? car.priceUsd * 3.75 : 0) || 0,
                    image: car.images?.[0] || '',
                    category: car.category
                }))
            }
        });
    } catch (error) {
        console.error('Dashboard client error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

// GET /api/v2/dashboard/admin - بيانات لوحة تحكم المسؤول
router.get('/admin', requireAuthAPI, async (req, res) => {
    try {
        // التحقق من أن المستخدم مسؤول
        if (!req.user.role || !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        const [
            totalCars,
            totalUsers,
            totalAuctions,
            runningAuctions,
            totalOrders,
            pendingOrders
        ] = await Promise.all([
            Car.countDocuments(),
            require('../../../models/User').countDocuments(),
            Auction.countDocuments(),
            Auction.countDocuments({ status: 'running' }),
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' })
        ]);

        res.json({
            success: true,
            data: {
                totalCars,
                totalUsers,
                totalAuctions,
                runningAuctions,
                totalOrders,
                pendingOrders
            }
        });
    } catch (error) {
        console.error('Dashboard admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

module.exports = router;
