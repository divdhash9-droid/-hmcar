// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/security.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const DeviceFingerprint = require('../../../models/DeviceFingerprint');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// جلب كل الأجهزة والمستخدمين المرتبطين (بدون تكرار)
router.get('/devices', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = {};

        if (search) {
            query.$or = [
                { banCode: { $regex: new RegExp(`^${search}$`, 'i') } },
                { ip: { $regex: new RegExp(search, 'i') } },
                { linkedUsername: { $regex: new RegExp(search, 'i') } }
            ];
        }

        const allDevices = await DeviceFingerprint.find(query).sort({ updatedAt: -1 });

        // ── إزالة التكرار: نحتفظ بآخر سجل لكل (ip + linkedUsername) ──
        const seen = new Map();
        for (const device of allDevices) {
            const key = `${device.ip}___${(device.linkedUsername || '').toLowerCase()}`;
            if (!seen.has(key)) {
                seen.set(key, device);
            } else {
                // إذا الجهاز الجديد محظور والقديم غير محظور - نحتفظ بالمحظور
                const existing = seen.get(key);
                if (device.banned && !existing.banned) {
                    seen.set(key, device);
                }
            }
        }

        const devices = Array.from(seen.values())
            .sort((a, b) => {
                // المحظورون أولاً ثم المُستثنون ثم الباقون
                if (a.banned !== b.banned) return a.banned ? -1 : 1;
                if (a.exemptFromSecurity !== b.exemptFromSecurity) return a.exemptFromSecurity ? -1 : 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });

        res.json({
            success: true,
            devices,
            total: devices.length
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ داخلي' });
    }
});


// تفعيل/تعطيل استثناء المستدخم من قيود الدخول المتعدد
router.post('/toggle-exempt/:id', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const device = await DeviceFingerprint.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
        }

        device.exemptFromSecurity = !device.exemptFromSecurity;

        // إذا تم إعفاؤه وكان محظوراً، يتم فك الحظر تلقائياً
        if (device.exemptFromSecurity && device.banned) {
            device.banned = false;
            device.banCode = '';
            device.failedAttempts = 0;
            device.unbannedAt = Date.now();
            device.unbannedBy = req.user.userId;
        }

        await device.save();

        res.json({ success: true, message: device.exemptFromSecurity ? 'تم إعفاء الجهاز من القيود' : 'تم تفعيل القيود على الجهاز', exemptFromSecurity: device.exemptFromSecurity });
    } catch (error) {
        console.error('Error toggling device exemption:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ داخلي' });
    }
});

// حظر أو فك حظر جهاز
router.post('/toggle-ban/:id', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const device = await DeviceFingerprint.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
        }

        device.banned = !device.banned;

        if (device.banned) {
            device.banCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            device.exemptFromSecurity = false; // إلغاء الإعفاء إذا تم حظره يدوياً
        } else {
            device.banCode = '';
            device.failedAttempts = 0;
            device.unbannedAt = Date.now();
            device.unbannedBy = req.user.userId;
            device.linkedUsername = ''; // مسح الحساب المرتبط حتى يتسنى له الدخول من جديد
        }

        await device.save();

        res.json({ success: true, message: device.banned ? 'تم حظر الجهاز بنجاح' : 'تم فك الحظر بنجاح', banned: device.banned });
    } catch (error) {
        console.error('Error toggling device ban:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ أثاء معالجة الحظر' });
    }
});

module.exports = router;
