// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/orders.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Order = require('../../../models/Order');
const SiteSettings = require('../../../models/SiteSettings');
const { requireAuthAPI } = require('../../../middleware/auth');

function toFiniteNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

// GET /api/v2/orders - جلب طلبات المستخدم (أو الكل للأدمن)
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        let filter = { buyer: userId };
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            filter = {};
        }

        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
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
                orders,
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
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/orders - إنشاء طلب جديد (يُستدعى عند الضغط على زر واتساب أو تأكيد السلة)
router.post('/', async (req, res) => {
    try {
        const { buyerId, items, pricing, notes, channel = 'whatsapp' } = req.body;
        const settings = await SiteSettings.getSettings().catch(() => null);

        const usdToSar = toFiniteNumber(req.body?.currencySnapshot?.usdToSar) || toFiniteNumber(settings?.currencySettings?.usdToSar) || 3.75;
        const usdToKrw = toFiniteNumber(req.body?.currencySnapshot?.usdToKrw) || toFiniteNumber(settings?.currencySettings?.usdToKrw) || 1350;
        const activeCurrency = String(req.body?.currencySnapshot?.activeCurrency || settings?.currencySettings?.activeCurrency || 'SAR').toUpperCase();

        const normalizedPricing = {
            subTotalSar: toFiniteNumber(pricing?.subTotalSar),
            subTotalUsd: toFiniteNumber(pricing?.subTotalUsd),
            shippingSar: toFiniteNumber(pricing?.shippingSar),
            shippingUsd: toFiniteNumber(pricing?.shippingUsd),
            grandTotalSar: toFiniteNumber(pricing?.grandTotalSar),
            grandTotalUsd: toFiniteNumber(pricing?.grandTotalUsd),
        };

        if (!normalizedPricing.subTotalUsd && normalizedPricing.subTotalSar > 0) {
            normalizedPricing.subTotalUsd = Number((normalizedPricing.subTotalSar / usdToSar).toFixed(2));
        }
        if (!normalizedPricing.subTotalSar && normalizedPricing.subTotalUsd > 0) {
            normalizedPricing.subTotalSar = Number((normalizedPricing.subTotalUsd * usdToSar).toFixed(2));
        }

        if (!normalizedPricing.shippingUsd && normalizedPricing.shippingSar > 0) {
            normalizedPricing.shippingUsd = Number((normalizedPricing.shippingSar / usdToSar).toFixed(2));
        }
        if (!normalizedPricing.shippingSar && normalizedPricing.shippingUsd > 0) {
            normalizedPricing.shippingSar = Number((normalizedPricing.shippingUsd * usdToSar).toFixed(2));
        }

        if (!normalizedPricing.grandTotalUsd && normalizedPricing.grandTotalSar > 0) {
            normalizedPricing.grandTotalUsd = Number((normalizedPricing.grandTotalSar / usdToSar).toFixed(2));
        }
        if (!normalizedPricing.grandTotalSar && normalizedPricing.grandTotalUsd > 0) {
            normalizedPricing.grandTotalSar = Number((normalizedPricing.grandTotalUsd * usdToSar).toFixed(2));
        }

        normalizedPricing.exchangeSnapshot = {
            usdToSar,
            usdToKrw,
            activeCurrency: ['SAR', 'USD', 'KRW'].includes(activeCurrency) ? activeCurrency : 'SAR',
            capturedAt: new Date(),
        };

        const normalizedItems = Array.isArray(items)
            ? items.map((item) => {
                const unitPriceSar = toFiniteNumber(item?.unitPriceSar);
                const unitPriceUsd = toFiniteNumber(item?.unitPriceUsd);

                const resolvedUnitPriceSar = unitPriceSar || (unitPriceUsd > 0 ? Number((unitPriceUsd * usdToSar).toFixed(2)) : 0);
                const resolvedUnitPriceUsd = unitPriceUsd || (unitPriceSar > 0 ? Number((unitPriceSar / usdToSar).toFixed(2)) : 0);

                return {
                    ...item,
                    unitPriceSar: resolvedUnitPriceSar,
                    unitPriceUsd: resolvedUnitPriceUsd,
                };
            })
            : [];

        // توليد رقم طلب فريد
        const orderNumber = `HM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newOrder = new Order({
            orderNumber,
            buyer: buyerId || req.user?.userId, // قد يكون ضيفاً أحياناً
            items: normalizedItems,
            pricing: normalizedPricing,
            notes,
            channel,
            status: 'pending'
        });

        await newOrder.save();

        // [[ARABIC_COMMENT]] إرسال إشعار لكافة المشرفين عند وجود طلب جديد
        try {
            const User = require('../../../models/User');
            const Notification = require('../../../models/Notification');

            const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
            const notifications = admins.map(admin => ({
                user: admin._id,
                title: 'طلب شراء جديد',
                message: `وصل طلب جديد برقم ${orderNumber} لـ ${items[0]?.titleSnapshot}`,
                type: 'info',
                link: `/admin/orders/${newOrder._id}`,
                status: 'new'
            }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        } catch (notifyErr) {
            console.error('Failed to create admin notifications:', notifyErr);
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: newOrder
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
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

        const order = await Order.findOne(query).populate('buyer', 'name email phone').lean();

        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PATCH /api/v2/orders/:id/status - تحديث حالة الطلب (admin only)
router.patch('/:id/status', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

        const oldStatus = order.status;
        order.status = status;
        order.statusHistory.push({
            from: oldStatus,
            to: status,
            by: req.user.userId || req.user._id,
            at: new Date()
        });

        await order.save();
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
