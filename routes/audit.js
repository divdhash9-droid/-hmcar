const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// Middleware للتحقق من صلاحية عرض السجلات
const requireAuditPermission = [requireAuth, requirePermission('view_analytics')];

// Get all audit logs with filtering and pagination
router.get('/', requireAuditPermission, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      target,
      category,
      severity,
      result,
      userId,
      startDate,
      endDate,
      search,
      tags
    } = req.query;

    const filter = {};
    
    // Build filter
    if (action) filter.action = action;
    if (target) filter.target = target;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (result) filter.result = result;
    if (userId) filter.user = userId;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search in description
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'metadata.details': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip(skip),
      AuditLog.countDocuments(filter)
    ]);

    // Get statistics
    const stats = await getAuditStats(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      stats,
      filters: {
        action,
        target,
        category,
        severity,
        result,
        userId,
        startDate,
        endDate,
        search,
        tags
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific audit log
router.get('/:id', requireAuditPermission, async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'name email role phone');
    
    if (!log) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }
    
    res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get audit statistics
router.get('/stats/overview', requireAuditPermission, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    const stats = await getAuditStats({ createdAt: { $gte: startDate } });
    
    res.json({
      success: true,
      stats,
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get security events
router.get('/security/events', requireAuditPermission, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    const securityEvents = await AuditLog.find({
      $or: [
        { category: 'SECURITY' },
        { severity: 'CRITICAL' },
        { action: { $in: ['LOGIN', 'LOGOUT', 'SUSPEND', 'ACTIVATE', 'RESET_PASSWORD'] } }
      ],
      createdAt: { $gte: startDate }
    })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      success: true,
      events: securityEvents,
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export audit logs
router.get('/export/csv', requireAuditPermission, async (req, res) => {
  try {
    const { startDate, endDate, action, target, category } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (action) filter.action = action;
    if (target) filter.target = target;
    if (category) filter.category = category;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10000); // Limit for performance

    // Generate CSV
    const csv = generateAuditCSV(logs);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user activity timeline
router.get('/user/:userId/timeline', requireAuditPermission, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    const activities = await AuditLog.find({
      user: userId,
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      success: true,
      activities,
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching user timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system health metrics
router.get('/system/health', requireAuditPermission, async (req, res) => {
  try {
    const { period = '24' } = req.query; // Last 24 hours
    const startDate = new Date(Date.now() - parseInt(period) * 60 * 60 * 1000);
    
    const metrics = await getSystemHealthMetrics(startDate);
    
    res.json({
      success: true,
      metrics,
      period: `${period} hours`
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getAuditStats(filter = {}) {
  const [
    totalLogs,
    actionStats,
    severityStats,
    categoryStats,
    resultStats,
    userStats,
    recentCritical
  ] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$result', count: { $sum: 1 } } }
    ]),
    AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      }
    ]),
    AuditLog.find({ ...filter, severity: 'CRITICAL' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
  ]);

  return {
    totalLogs,
    actionStats: actionStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    severityStats: severityStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    categoryStats: categoryStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    resultStats: resultStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    topUsers: userStats.map(item => ({
      userId: item._id,
      count: item.count,
      user: item.userInfo[0]
    })),
    recentCritical
  };
}

async function getSystemHealthMetrics(startDate) {
  const [
    totalOperations,
    failedOperations,
    avgDuration,
    criticalEvents,
    securityEvents,
    uniqueUsers
  ] = await Promise.all([
    AuditLog.countDocuments({ createdAt: { $gte: startDate } }),
    AuditLog.countDocuments({ 
      createdAt: { $gte: startDate }, 
      result: 'FAILURE' 
    }),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]),
    AuditLog.countDocuments({ 
      createdAt: { $gte: startDate }, 
      severity: 'CRITICAL' 
    }),
    AuditLog.countDocuments({ 
      createdAt: { $gte: startDate }, 
      category: 'SECURITY' 
    }),
    AuditLog.distinct('user', { createdAt: { $gte: startDate } })
  ]);

  return {
    totalOperations,
    failedOperations,
    successRate: totalOperations > 0 ? ((totalOperations - failedOperations) / totalOperations * 100).toFixed(2) : 100,
    avgDuration: avgDuration[0]?.avgDuration || 0,
    criticalEvents,
    securityEvents,
    uniqueUsers: uniqueUsers.length
  };
}

function generateAuditCSV(logs) {
  const headers = [
    'Date', 'User', 'Action', 'Target', 'Description', 'Result', 
    'Severity', 'Category', 'IP Address', 'Duration (ms)'
  ];
  
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.user ? `${log.user.name} (${log.user.email})` : 'System',
    log.action,
    log.target,
    log.description,
    log.result,
    log.severity,
    log.category,
    log.ipAddress,
    log.duration
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;
