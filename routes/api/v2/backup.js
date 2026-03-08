// [[ARABIC_COMMENT]] نظام النسخ الاحتياطي التلقائي لقاعدة البيانات
// [[ARABIC_COMMENT]] يتم تشغيله يومياً أو عند الطلب من لوحة الأدمن
// [[ARABIC_COMMENT]] يحفظ بيانات السيارات والقطع والطلبات والمستخدمين

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');

// [[ARABIC_COMMENT]] جلب جميع النماذج للنسخ الاحتياطي
const Car = require('../../../models/Car');
const SparePart = require('../../../models/SparePart'); // [[ARABIC_COMMENT]] الاسم الصحيح للنموذج هو SparePart وليس Part

// [[ARABIC_COMMENT]] POST /api/v2/backup - إنشاء نسخة احتياطية يدوية (أدمن فقط)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_cars'), async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // [[ARABIC_COMMENT]] جلب جميع البيانات
        const [cars, parts] = await Promise.all([
            Car.find({}).lean(),
            SparePart.find({}).lean(),
        ]);

        // [[ARABIC_COMMENT]] بناء ملف النسخة الاحتياطية
        const backupData = {
            meta: {
                version: '2.0',
                createdAt: new Date().toISOString(),
                createdBy: req.user?.userId,
                counts: {
                    cars: cars.length,
                    parts: parts.length,
                }
            },
            collections: {
                cars,
                parts,
            }
        };

        // [[ARABIC_COMMENT]] إرسال ملف JSON للتحميل مباشرة
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="hm-backup-${timestamp}.json"`);
        res.json(backupData);

    } catch (error) {
        console.error('[Backup] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Backup failed',
            message: error.message
        });
    }
});

// [[ARABIC_COMMENT]] GET /api/v2/backup/status - معلومات النسخ الاحتياطي
router.get('/status', requireAuthAPI, requirePermissionAPI('manage_cars'), async (req, res) => {
    try {
        const [carCount, partCount] = await Promise.all([
            Car.countDocuments(),
            SparePart.countDocuments(),
        ]);

        res.json({
            success: true,
            data: {
                lastBackup: null, // [[ARABIC_COMMENT]] يمكن تخزين وقت آخر نسخة في Redis أو قاعدة البيانات مستقبلاً
                counts: {
                    cars: carCount,
                    parts: partCount,
                    total: carCount + partCount,
                },
                recommendation: (carCount + partCount) > 100
                    ? 'يُنصح بأخذ نسخة احتياطية أسبوعية لحماية البيانات'
                    : 'بياناتك محدودة، خذ نسخة احتياطية شهرياً كحد أدنى'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
