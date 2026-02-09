// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/orders.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Order = require('../../../models/Order');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/orders - جلب طلبات المستخدم
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        // بناء الفلتر
        const filter = { buyer: userId };
        if (status) {
            filter.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('car', 'title make model year images price')
                .populate('buyer', 'name email phone')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Order.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                orders: orders.map(order => ({
                    id: order._id,
                    orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                    car: {
                        id: order.car?._id,
                        title: order.car?.title,
                        make: order.car?.make,
                        model: order.car?.model,
                        year: order.car?.year,
                        image: order.car?.images?.[0] || '',
                        price: order.car?.price || order.car?.priceSar || 0
                    },
                    totalAmount: order.totalAmount || order.total || 0,
                    status: order.status,
                    paymentStatus: order.paymentStatus || 'pending',
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                    deliveryAddress: order.deliveryAddress,
                    notes: order.notes
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
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

// GET /api/v2/orders/:id - جلب تفاصيل طلب محدد
router.get('/:id', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const order = await Order.findOne({
            _id: req.params.id,
            buyer: userId
        })
            .populate('car', 'title make model year images price category')
            .populate('buyer', 'name email phone')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: order._id,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                car: {
                    id: order.car?._id,
                    title: order.car?.title,
                    make: order.car?.make,
                    model: order.car?.model,
                    year: order.car?.year,
                    images: order.car?.images || [],
                    price: order.car?.price || order.car?.priceSar || 0,
                    category: order.car?.category
                },
                buyer: {
                    name: order.buyer?.name,
                    email: order.buyer?.email,
                    phone: order.buyer?.phone
                },
                totalAmount: order.totalAmount || order.total || 0,
                status: order.status,
                paymentStatus: order.paymentStatus || 'pending',
                paymentMethod: order.paymentMethod,
                deliveryAddress: order.deliveryAddress,
                notes: order.notes,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            }
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

module.exports = router;
