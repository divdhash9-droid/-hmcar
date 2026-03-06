// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/security.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const DeviceFingerprint = require('../../../models/DeviceFingerprint');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// جلب كل الأجهزة المحظورة
router.get('/banned-devices', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = { banned: true };

        // إمكانية البحث برمز الحظر، الـ IP، أو اسم الحساب
        if (search) {
            query.$or = [
                { banCode: { $regex: new RegExp(`^${search}$`, 'i') } },
                { ip: { $regex: new RegExp(search, 'i') } },
                { linkedUsername: { $regex: new RegExp(search, 'i') } }
            ];
        }

        const devices = await DeviceFingerprint.find(query).sort({ updatedAt: -1 });

        res.json({
            success: true,
            devices
        });
    } catch (error) {
        console.error('Error fetching banned devices:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ داخلي' });
    }
});

// فك الحظر عن جهاز معين
router.post('/unban-device/:id', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const device = await DeviceFingerprint.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
        }

        device.banned = false;
        device.banCode = '';
        device.failedAttempts = 0;
        device.unbannedAt = Date.now();
        device.unbannedBy = req.user.userId;
        // مسح الحساب المرتبط حتى يتسنى له الدخول من جديد بأي حساب
        device.linkedUsername = '';

        await device.save();

        res.json({ success: true, message: 'تم فك الحظر بنجاح ويمكن للعميل الدخول ببيانات جديدة.' });
    } catch (error) {
        console.error('Error unbanning device:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ أثاء فك الحظر' });
    }
});

module.exports = router;
