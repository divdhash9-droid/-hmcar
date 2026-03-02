// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/contact.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Contact = require('../../../models/Contact');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// إرسال رسالة اتصال
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'الاسم والبريد الإلكتروني والرسالة مطلوبة'
            });
        }

        // التحقق من صحة البريد
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'البريد الإلكتروني غير صالح'
            });
        }

        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            subject: subject ? subject.trim() : 'استفسار عام',
            message: message.trim(),
            status: 'new'
        });

        // إضافة إلى سجل الأنشطة ليظهر للأدمن
        try {
            const AuditLog = require('../../../models/AuditLog');
            await AuditLog.create({
                action: 'CREATE',
                target: 'Contact',
                targetId: contact._id,
                description: `رسالة تواصل جديدة من ${name.trim()}: ${subject || 'استفسار عام'}`,
                metadata: { email: email.trim() }
            });
        } catch (auditErr) { console.error('Failed to log contact activity', auditErr); }

        res.status(201).json({
            success: true,
            message: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً',
            data: { id: contact._id }
        });
    } catch (error) {
        console.error('خطأ في إرسال رسالة الاتصال:', error);
        res.status(500).json({ success: false, error: 'فشل في الإرسال' });
    }
});

// الحصول على جميع رسائل الاتصال (للأدمن)
router.get('/', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = status !== 'all' ? { status } : {};

        const [contacts, total] = await Promise.all([
            Contact.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Contact.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: contacts,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('خطأ في جلب رسائل الاتصال:', error);
        res.status(500).json({ success: false, error: 'فشل في الجلب' });
    }
});

// تحديث حالة رسالة (للأدمن)
router.patch('/:id/status', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['new', 'read', 'replied', 'closed'].includes(status)) {
            return res.status(400).json({ success: false, error: 'حالة غير صالحة' });
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة الرسالة',
            data: contact
        });
    } catch (error) {
        console.error('خطأ في تحديث الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في التحديث' });
    }
});

// حذف رسالة (للأدمن)
router.delete('/:id', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }

        res.json({
            success: true,
            message: 'تم حذف الرسالة'
        });
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في الحذف' });
    }
});

module.exports = router;
