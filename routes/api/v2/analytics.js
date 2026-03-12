// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/analytics.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const AnalyticsService = require('../../../services/AnalyticsService');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// GET /api/v2/analytics - ملخص إحصائي (admin فقط)
router.get('/', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    // [[ARABIC_COMMENT]] period اختياري: all | week | month | year
    const period = String(req.query.period || 'all');
    const stats = await AnalyticsService.getSummary(period);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v2/analytics/activities - أحدث الأنشطة
router.get('/activities', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const activities = await AnalyticsService.getRecentActivities(req.query.limit || 10);
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v2/analytics/detailed - إحصائيات تفصيلية للتقارير
router.get('/detailed', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    // [[ARABIC_COMMENT]] period يحدد نافذة البيانات في الرسم/أفضل المبيعات
    const period = String(req.query.period || 'all');
    const detailed = await AnalyticsService.getMonthlyStats(period);
    res.json({ success: true, detailed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
