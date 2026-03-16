// مسارات API للطلبات الخاصة (Concierge Requests)

const express = require('express');
const router = express.Router();
const ConciergeRequest = require('../../../models/ConciergeRequest');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// ── GET /api/v2/concierge/stats ── إحصائيات الطلبات (الأدمن)
router.get('/stats', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const [total, newCount, inProgress, completed, cancelled, byCar, byParts] = await Promise.all([
            ConciergeRequest.countDocuments(),
            ConciergeRequest.countDocuments({ status: 'new' }),
            ConciergeRequest.countDocuments({ status: 'in_progress' }),
            ConciergeRequest.countDocuments({ status: 'completed' }),
            ConciergeRequest.countDocuments({ status: 'cancelled' }),
            ConciergeRequest.countDocuments({ type: 'car' }),
            ConciergeRequest.countDocuments({ type: 'parts' }),
        ]);

        // أحدث 5 طلبات
        const recent = await ConciergeRequest.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            success: true,
            data: {
                total, new: newCount, in_progress: inProgress,
                completed, cancelled,
                byType: { car: byCar, parts: byParts },
                recent
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل في جلب الإحصائيات' });
    }
});

// ── POST /api/v2/concierge ── إرسال طلب جديد (متاح للجميع)
router.post('/', async (req, res) => {
    try {
        const {
            type, name, phone,
            carName, model, color, colorName, year,
            partName, imageUrl,
            description,
            source,
            externalUrl,
            contactPreference
        } = req.body;

        if (!name || !phone || !type) {
            return res.status(400).json({
                success: false,
                message: 'الاسم والهاتف ونوع الطلب مطلوبة'
            });
        }

        // حفظ الطلب
        const request = await ConciergeRequest.create({
            type, name, phone,
            user: req.body.user || null, // [[ARABIC_COMMENT]] ربط المستخدم إذا توفر
            carName, model, color, colorName, year,
            partName, imageUrl,
            description,
            source: source || 'general',
            externalUrl,
            contactPreference: contactPreference || 'whatsapp',
            status: 'new'
        });

        // ── إشعار الأدمن ──
        // جلب جميع المستخدمين الأدمن
        try {
            const admins = await User.find({ role: { $in: ['admin', 'super_admin', 'superadmin'] } }).select('_id').lean();
            if (admins.length > 0) {
                const typeLabel = type === 'car' ? 'طلب سيارة' : 'طلب قطعة غيار';
                const notifTitle = `🔔 ${typeLabel} جديد من ${name}`;
                const notifMsg = type === 'car'
                    ? `${name} يطلب: ${carName || ''}${model ? ` ${model}` : ''}${colorName ? ` - ${colorName}` : ''}${year ? ` (${year})` : ''} | هاتف: ${phone}`
                    : `${name} يطلب قطعة: ${partName || ''} | السيارة: ${carName || ''} ${year || ''} | هاتف: ${phone}`;

                const notifications = admins.map(admin => ({
                    user: admin._id,
                    title: notifTitle,
                    message: notifMsg,
                    type: 'info',
                    link: '/admin/concierge',
                    status: 'new',
                    read: false
                }));
                await Notification.insertMany(notifications);
            }
        } catch (notifErr) {
            console.error('Failed to create admin notifications:', notifErr);
            // لا نوقف الرد بسبب فشل الإشعار
        }

        // ── رسالة تأكيد للعميل عبر واتساب ──
        const confirmText = type === 'car'
            ? `✅ *تأكيد طلبك - CARHM*\n\nمرحباً ${name}،\nتم استلام طلب السيارة بنجاح!\n🚗 السيارة: ${carName || ''} ${model || ''}\n🎨 اللون: ${colorName || ''}\n📅 السنة: ${year || ''}\n\nسيتواصل معك فريقنا قريباً ✨`
            : `✅ *تأكيد طلبك - CARHM*\n\nمرحباً ${name}،\nتم استلام طلب القطعة بنجاح!\n🔧 القطعة: ${partName || ''}\n🚗 السيارة: ${carName || ''} ${year || ''}\n\nسيتواصل معك فريقنا قريباً ✨`;

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلبك بنجاح. سيتواصل معك فريقنا قريبًا.',
            data: {
                id: request._id,
                confirmWhatsApp: confirmText,  // للواجهة لإرساله للعميل
                clientPhone: phone
            }
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
        const { type, status, source, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (source) filter.source = source;

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
        const { status, adminNotes, auctionDate } = req.body;
        const validStatuses = ['new', 'in_progress', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
        }

        const request = await ConciergeRequest.findByIdAndUpdate(
            req.params.id,
            { 
                status, 
                ...(adminNotes && { adminNotes }),
                ...(auctionDate && { auctionDate })
            },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
        }

        // [[ARABIC_COMMENT]] إرسال إشعار للعميل إذا تم قبول الطلب (تغيير الحالة لـ in_progress)
        if (status === 'in_progress' && request.user) {
            try {
                const UserNotification = require('../../../models/UserNotification');
                const dateStr = auctionDate ? ` في موعد: ${new Date(auctionDate).toLocaleString('ar-YE')}` : '';
                await UserNotification.createNotification({
                    user: request.user,
                    title: '✅ تمت الموافقة على طلب المزايدة',
                    message: `تمت الموافقة على طلبك للسيارة: ${request.carName || ''}.${dateStr} سيتم المتابعة معك عبر واتساب.`,
                    type: 'success',
                    actionUrl: '/dashboard'
                });
            } catch (notifErr) {
                console.error('Failed to send client notification:', notifErr);
            }
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
