const express = require('express');
const router = express.Router();
const AnalyticsService = require('../../services/AnalyticsService');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roles');

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const stats = await AnalyticsService.getSummary();
    res.render('admin/analytics', { layout: 'layout', stats });
  } catch (error) {
    res.status(500).send('خطأ في جلب الإحصائيات');
  }
});

module.exports = router;
