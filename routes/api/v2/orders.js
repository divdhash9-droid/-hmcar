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
        let filter = { buyer: userId };

        // إذا كان مسؤولاً، يمكنه رؤية جميع الطلبات
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            filter = {};
        }

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
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.buyer = userId;
        }

        const order = await Order.findOne(query)
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

// PATCH /api/v2/orders/:id/status - تحديث حالة الطلب (admin only)
router.patch('/:id/status', requireAuthAPI, async (req, res) => {
    try {
        // التحقق من الصلاحيات
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        const { status } = req.body;
        const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const oldStatus = order.status;
        order.status = status;

        // سجل تاريخ التغيير
        order.statusHistory.push({
            from: oldStatus,
            to: status,
            by: req.user.userId || req.user._id,
            at: new Date()
        });

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: { status: order.status }
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

// DELETE /api/v2/orders/:id - حذف الطلب يعني تغيير حالته لـ cancelled (الأدمن يحذف = ملغاة للعميل)
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden'
            });
        }

        // [[ARABIC_COMMENT]] بدلاً من الحذف الفعلي، نغير الحالة لـ cancelled حتى يرى العميل "ملغي"
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // [[ARABIC_COMMENT]] تسجيل سبب الإلغاء وتحديث الحالة
        const oldStatus = order.status;
        order.status = 'cancelled';
        order.statusHistory.push({
            from: oldStatus,
            to: 'cancelled',
            by: req.user.userId || req.user._id,
            at: new Date()
        });

        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

module.exports = router;
