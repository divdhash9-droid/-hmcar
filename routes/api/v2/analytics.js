// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/analytics.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const AnalyticsService = require('../../../services/AnalyticsService');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// GET /api/v2/analytics - ملخص إحصائي (admin فقط)
router.get('/', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const stats = await AnalyticsService.getSummary();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
