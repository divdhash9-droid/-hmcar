// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/smart-alerts.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * routes/api/v2/smart-alerts.js
 * API الخاص بالتنبيهات الذكية
 *
 * GET    /api/v2/smart-alerts         - جلب تنبيهات المستخدم
 * POST   /api/v2/smart-alerts         - إنشاء تنبيه جديد
 * PUT    /api/v2/smart-alerts/:id     - تحديث تنبيه
 * DELETE /api/v2/smart-alerts/:id     - حذف تنبيه
 * PATCH  /api/v2/smart-alerts/:id/toggle - تفعيل/إيقاف تنبيه
 * GET    /api/v2/smart-alerts/stats   - إحصائيات التنبيهات
 */

const express = require('express');
const router = express.Router();
const SmartAlertService = require('../../../services/SmartAlertService');
const SmartAlert = require('../../../models/SmartAlert');

// Middleware للتحقق من تسجيل الدخول
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });
    }
    next();
};

// ======== GET /api/v2/smart-alerts ========
// جلب جميع تنبيهات المستخدم الحالي
router.get('/', requireAuth, async (req, res) => {
    try {
        const alerts = await SmartAlertService.getUserAlerts(req.session.userId);
        res.json({ success: true, data: alerts });
    } catch (err) {
        console.error('[API SmartAlerts GET]', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب التنبيهات' });
    }
});

// ======== GET /api/v2/smart-alerts/stats ========
// إحصائيات التنبيهات
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = await SmartAlertService.getUserStats(req.session.userId);
        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: 'حدث خطأ' });
    }
});

// ======== POST /api/v2/smart-alerts ========
// إنشاء تنبيه ذكي جديد
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, make, model, yearMin, yearMax, priceMin, priceMax,
            fuelType, transmission, category, condition, listingType,
            inApp, email, frequency } = req.body;

        // التحقق من وجود اسم التنبيه
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'يرجى إدخال اسم للتنبيه' });
        }

        // التحقق من وجود معيار واحد على الأقل
        const hasCriteria = make || model || yearMin || yearMax || priceMin || priceMax ||
            fuelType || transmission || category || condition || listingType;
        if (!hasCriteria) {
            return res.status(400).json({ success: false, message: 'يرجى تحديد معيار واحد على الأقل للتنبيه' });
        }

        const alert = await SmartAlertService.createAlert(req.session.userId, req.body);
        res.status(201).json({ success: true, data: alert, message: 'تم إنشاء التنبيه الذكي بنجاح' });

    } catch (err) {
        console.error('[API SmartAlerts POST]', err);
        if (err.message.includes('10 تنبيهات')) {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'حدث خطأ في إنشاء التنبيه' });
    }
});

// ======== PUT /api/v2/smart-alerts/:id ========
// تحديث تنبيه
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const alert = await SmartAlertService.updateAlert(req.params.id, req.session.userId, req.body);
        res.json({ success: true, data: alert, message: 'تم تحديث التنبيه بنجاح' });
    } catch (err) {
        console.error('[API SmartAlerts PUT]', err);
        if (err.message.includes('غير موجود')) {
            return res.status(404).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'حدث خطأ في تحديث التنبيه' });
    }
});

// ======== PATCH /api/v2/smart-alerts/:id/toggle ========
// تفعيل أو إيقاف تنبيه
router.patch('/:id/toggle', requireAuth, async (req, res) => {
    try {
        const alert = await SmartAlert.findOne({ _id: req.params.id, user: req.session.userId });
        if (!alert) {
            return res.status(404).json({ success: false, message: 'التنبيه غير موجود' });
        }
        alert.isActive = !alert.isActive;
        await alert.save();
        res.json({
            success: true,
            data: { isActive: alert.isActive },
            message: alert.isActive ? 'تم تفعيل التنبيه' : 'تم إيقاف التنبيه'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'حدث خطأ' });
    }
});

// ======== DELETE /api/v2/smart-alerts/:id ========
// حذف تنبيه
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await SmartAlertService.deleteAlert(req.params.id, req.session.userId);
        res.json({ success: true, message: 'تم حذف التنبيه بنجاح' });
    } catch (err) {
        console.error('[API SmartAlerts DELETE]', err);
        if (err.message.includes('غير موجود')) {
            return res.status(404).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'حدث خطأ في حذف التنبيه' });
    }
});

module.exports = router;
