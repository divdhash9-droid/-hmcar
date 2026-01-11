const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const { requireAuthAPI } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const cacheService = require('../services/CacheService');

// Middleware to track page views
router.use(async (req, res, next) => {
  // Only track actual page requests, not API calls
  if (req.xhr || req.path.startsWith('/api/')) {
    return next();
  }

  try {
    const sessionId = req.sessionID || Analytics.generateSessionId();
    const userId = req.user ? req.user._id : null;

    await Analytics.track('page_view', {
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      referrer: req.get('Referrer'),
      device: getDeviceType(req.get('User-Agent')),
      browser: getBrowser(req.get('User-Agent')),
      os: getOS(req.get('User-Agent'))
    }, userId, sessionId);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }

  next();
});

// Get dashboard analytics
router.get('/dashboard', [requireAuthAPI, requireRole(['admin', 'super_admin'])], async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const cacheKey = `analytics_dashboard_${period}`;
    let data = await cacheService.get(cacheKey);

    if (!data) {
      const [
        metrics,
        pageViews,
        popularCars,
        searchAnalytics,
        deviceAnalytics,
        timeSeriesData,
        conversionFunnel
      ] = await Promise.all([
        Analytics.getMetrics(startDate, endDate),
        Analytics.getPageViews(startDate, endDate),
        Analytics.getPopularCars(startDate, endDate),
        Analytics.getSearchAnalytics(startDate, endDate),
        Analytics.getDeviceAnalytics(startDate, endDate),
        Analytics.getTimeSeriesData(startDate, endDate, 'hour'),
        Analytics.getConversionFunnel(startDate, endDate)
      ]);

      data = {
        metrics,
        pageViews,
        popularCars,
        searchAnalytics,
        deviceAnalytics,
        timeSeriesData,
        conversionFunnel,
        period,
        startDate,
        endDate
      };

      await cacheService.set(cacheKey, data, 600); // Cache for 10 minutes
    }

    res.json(data);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get detailed analytics for specific metrics
router.get('/metrics/:type', [requireAuthAPI, requireRole(['admin', 'super_admin'])], async (req, res) => {
  try {
    const { type } = req.params;
    const { period = '7d', interval = 'hour' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const cacheKey = `analytics_${type}_${period}_${interval}`;
    let data = await cacheService.get(cacheKey);

    if (!data) {
      switch (type) {
        case 'page_views':
          data = await Analytics.getPageViews(startDate, endDate, 20);
          break;
        case 'popular_cars':
          data = await Analytics.getPopularCars(startDate, endDate, 20);
          // Populate car details
          const Car = require('../models/Car');
          data = await Car.populate(data, { path: 'carId', select: 'title brand model price images' });
          break;
        case 'search_analytics':
          data = await Analytics.getSearchAnalytics(startDate, endDate, 50);
          break;
        case 'user_activity':
          data = await Analytics.getUserActivity(startDate, endDate, 20);
          // Populate user details
          const User = require('../models/User');
          data = await User.populate(data, { path: 'userId', select: 'name email phone' });
          break;
        case 'device_analytics':
          data = await Analytics.getDeviceAnalytics(startDate, endDate);
          break;
        case 'time_series':
          data = await Analytics.getTimeSeriesData(startDate, endDate, interval);
          break;
        case 'conversion_funnel':
          data = await Analytics.getConversionFunnel(startDate, endDate);
          break;
        default:
          return res.status(400).json({ error: 'Invalid analytics type' });
      }

      await cacheService.set(cacheKey, data, 300); // Cache for 5 minutes
    }

    res.json({ type, period, data });
  } catch (error) {
    console.error('Analytics metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics metrics' });
  }
});

// Track custom events
router.post('/track', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    const userId = req.user ? req.user._id : null;
    const sessionId = req.sessionID || Analytics.generateSessionId();

    const analytics = await Analytics.track(type, data, userId, sessionId);

    res.json({ success: true, tracked: !!analytics });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get real-time analytics
router.get('/realtime', [requireAuthAPI, requireRole(['admin', 'super_admin'])], async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      recentPageViews,
      recentSearches,
      recentCarViews,
      recentBids,
      onlineUsers
    ] = await Promise.all([
      Analytics.countDocuments({
        type: 'page_view',
        timestamp: { $gte: oneHourAgo }
      }),
      Analytics.countDocuments({
        type: 'search',
        timestamp: { $gte: oneHourAgo }
      }),
      Analytics.countDocuments({
        type: 'car_view',
        timestamp: { $gte: oneHourAgo }
      }),
      Analytics.countDocuments({
        type: 'auction_bid',
        timestamp: { $gte: oneHourAgo }
      }),
      Analytics.distinct('userId', {
        timestamp: { $gte: oneHourAgo },
        userId: { $exists: true }
      })
    ]);

    res.json({
      timestamp: now,
      period: '1h',
      metrics: {
        pageViews: recentPageViews,
        searches: recentSearches,
        carViews: recentCarViews,
        bids: recentBids,
        onlineUsers: onlineUsers.length
      }
    });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time analytics' });
  }
});

// Export analytics data
router.get('/export', [requireAuthAPI, requireRole(['admin', 'super_admin'])], async (req, res) => {
  try {
    const { type = 'csv', period = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const analytics = await Analytics.find({
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'name email')
    .sort({ timestamp: -1 })
    .lean();

    if (type === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(analytics);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${period}.csv`);
      res.send(csv);
    } else if (type === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${period}.json`);
      res.json(analytics);
    } else {
      res.status(400).json({ error: 'Invalid export type' });
    }
  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// Helper functions
function getDateRange(period) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  // Set time to start of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

function getDeviceType(userAgent) {
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    return /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

function getBrowser(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOS(userAgent) {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Other';
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = [
    'Timestamp', 'Type', 'User ID', 'User Name', 'Session ID',
    'URL', 'IP Address', 'Device', 'Browser', 'OS', 'Car ID', 'Search Query'
  ];

  const csvRows = [headers.join(',')];

  data.forEach(item => {
    const row = [
      item.timestamp.toISOString(),
      item.type,
      item.userId?._id || item.userId || '',
      item.userId?.name || '',
      item.sessionId,
      item.data?.url || '',
      item.data?.ip || '',
      item.data?.device || '',
      item.data?.browser || '',
      item.data?.os || '',
      item.data?.carId || '',
      item.data?.searchQuery || ''
    ];

    csvRows.push(row.map(field => `"${field}"`).join(','));
  });

  return csvRows.join('\n');
}

module.exports = router;
