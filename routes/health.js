// [[ARABIC_HEADER]] هذا الملف (routes/health.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Health Check & Monitoring Routes
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/MonitoringService');
const { isAdmin } = require('../middleware/auth');

/**
 * Public health check endpoint
 */
router.get('/health', (req, res) => {
  const health = monitoringService.getHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    status: health.status,
    timestamp: health.timestamp,
    uptime: health.uptime
  });
});

/**
 * Detailed health check (admin only)
 */
router.get('/health/detailed', isAdmin, async (req, res) => {
  try {
    const report = await monitoringService.getDetailedReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate health report' });
  }
});

/**
 * System metrics (admin only)
 */
router.get('/metrics', isAdmin, (req, res) => {
  const metrics = {
    system: monitoringService.getSystemMetrics(),
    application: monitoringService.getApplicationMetrics()
  };
  
  res.json(metrics);
});

/**
 * Recent errors (admin only)
 */
router.get('/errors', isAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const errors = monitoringService.getRecentErrors(limit);
  
  res.json({ errors, count: errors.length });
});

module.exports = router;
