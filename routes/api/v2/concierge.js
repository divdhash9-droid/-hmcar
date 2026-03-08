// مسارات API للطلبات الخاصة (Concierge Requests)

const express = require('express');
const router = express.Router();
const ConciergeRequest = require('../../../models/ConciergeRequest');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// ── POST /api/v2/concierge ── إرسال طلب جديد (متاح للجميع)
router.post('/', async (req, res) => {
    try {
        const {
            type, name, phone,
            // طلب سيارة
            carName, model, color, colorName, year,
            // طلب قطع
            partName, imageUrl,
            // مشترك
            description
        } = req.body;

        if (!name || !phone || !type) {
            return res.status(400).json({
                success: false,
                message: ' الاسم والهاتف ونوع الطلب مطلوبة'
            });
        }

        const request = await ConciergeRequest.create({
            type, name, phone,
            carName, model, color, colorName, year,
            partName, imageUrl,
            description,
            status: 'new'
        });

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلبك بنجاح. سيتواصل معك فريقنا قريبًا.',
            data: { id: request._id }
        });

    } catch (error) {
        console.error('Concierge request error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إرسال الطلب. يرجى المحاولة مرة أخرى.'
        });
    }
});

// ── GET /api/v2/concierge ── جلب كل الطلبات (الأدمن فقط)
router.get('/', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [requests, total] = await Promise.all([
            ConciergeRequest.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ConciergeRequest.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                requests,
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get concierge requests error:', error);
        res.status(500).json({ success: false, message: 'فشل في جلب الطلبات' });
    }
});

// ── GET /api/v2/concierge/:id ── جلب طلب واحد
router.get('/:id', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const request = await ConciergeRequest.findById(req.params.id).lean();
        if (!request) {
            return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
        }
        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل في جلب الطلب' });
    }
});

// ── PATCH /api/v2/concierge/:id/status ── تحديث حالة الطلب (الأدمن)
router.patch('/:id/status', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const validStatuses = ['new', 'in_progress', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
        }

        const request = await ConciergeRequest.findByIdAndUpdate(
            req.params.id,
            { status, ...(adminNotes && { adminNotes }) },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
        }

        res.json({ success: true, message: 'تم تحديث الحالة', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل في تحديث الحالة' });
    }
});

// ── DELETE /api/v2/concierge/:id ── حذف طلب (الأدمن)
router.delete('/:id', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        await ConciergeRequest.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'تم حذف الطلب' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل في الحذف' });
    }
});

module.exports = router;
