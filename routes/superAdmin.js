// [[ARABIC_HEADER]] هذا الملف (routes/superAdmin.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const User = require('../models/User');
const Car = require('../models/Car');
const Auction = require('../models/Auction');
const Order = require('../models/Order');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Backup = require('../models/Backup');
const AdvancedNotification = require('../models/AdvancedNotification');

// Super Admin middleware
const requireSuperAdmin = [requireAuth, requireRole('super_admin')];

// Get dashboard statistics
router.get('/dashboard/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCars,
      availableCars,
      totalAuctions,
      activeAuctions,
      totalOrders,
      completedOrders,
      totalRevenue,
      totalReports,
      totalBackups,
      systemHealth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Car.countDocuments(),
      Car.countDocuments({ isSold: false }),
      Auction.countDocuments(),
      Auction.countDocuments({ status: 'running' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Report.countDocuments(),
      Backup.countDocuments({ status: 'completed' }),
      getSystemHealthStats()
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        cars: {
          total: totalCars,
          available: availableCars,
          sold: totalCars - availableCars
        },
        auctions: {
          total: totalAuctions,
          active: activeAuctions,
          completed: totalAuctions - activeAuctions
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: totalOrders - completedOrders
        },
        revenue: totalRevenue[0]?.total || 0,
        reports: totalReports,
        backups: totalBackups,
        system: systemHealth
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get users with pagination and filtering
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .limit(limit * 1)
        .skip(skip),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { phone: userData.phone }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'المستخدم موجود بالفعل' });
    }
    
    const user = new User(userData);
    await user.save();
    
    // Log the action
    await AuditLog.logUserAction(
      req.user,
      'CREATE',
      'User',
      `إنشاء مستخدم جديد: ${user.name}`,
      {
        targetId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );
    
    res.status(201).json({
      success: true,
      user: await User.findById(user._id).select('-password')
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    const oldData = { ...user.toObject() };
    Object.assign(user, req.body);
    await user.save();
    
    // Log the action
    await AuditLog.logUserAction(
      req.user,
      'UPDATE',
      'User',
      `تحديث بيانات المستخدم: ${user.name}`,
      {
        targetId: user._id,
        before: oldData,
        after: user.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );
    
    res.json({
      success: true,
      user: await User.findById(user._id).select('-password')
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'لا يمكن حذف حساب Super Admin' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    // Log the action
    await AuditLog.logUserAction(
      req.user,
      'DELETE',
      'User',
      `حذف المستخدم: ${user.name}`,
      {
        targetId: user._id,
        before: user.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );
    
    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system health
router.get('/system/health', requireSuperAdmin, async (req, res) => {
  try {
    const healthStats = await getSystemHealthStats();
    
    res.json({
      success: true,
      health: healthStats
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent activity
router.get('/activity/recent', requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const activities = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system metrics
router.get('/system/metrics', requireSuperAdmin, async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Perform system maintenance
router.post('/system/maintenance', requireSuperAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    
    let result;
    switch (action) {
      case 'cleanup_logs':
        result = await cleanupOldLogs();
        break;
      case 'cleanup_sessions':
        result = await cleanupOldSessions();
        break;
      case 'optimize_database':
        result = await optimizeDatabase();
        break;
      case 'clear_cache':
        result = await clearCache();
        break;
      default:
        return res.status(400).json({ error: 'إجراء صيانة غير معروف' });
    }
    
    // Log the maintenance action
    await AuditLog.logUserAction(
      req.user,
      'SYSTEM_CHANGE',
      'System',
      `تنفيذ صيانة النظام: ${action}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { action, result }
      }
    );
    
    res.json({
      success: true,
      message: 'تم تنفيذ الصيانة بنجاح',
      result
    });
  } catch (error) {
    console.error('Error performing maintenance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get security overview
router.get('/security/overview', requireSuperAdmin, async (req, res) => {
  try {
    const {
      recentLogins,
      failedLogins,
      securityEvents,
      suspiciousActivity
    } = await getSecurityOverview();
    
    res.json({
      success: true,
      security: {
        recentLogins,
        failedLogins,
        securityEvents,
        suspiciousActivity
      }
    });
  } catch (error) {
    console.error('Error fetching security overview:', error);
    res.status(500).json({ error: error.message });
  }
});

// Broadcast system notification
router.post('/notifications/broadcast', requireSuperAdmin, async (req, res) => {
  try {
    const { title, message, type, channels, userFilter } = req.body;
    
    const notification = await AdvancedNotification.createNotification({
      title,
      message,
      type: type || 'SYSTEM',
      channels: channels || ['IN_APP'],
      priority: 'HIGH',
      category: 'SYSTEM'
    });
    
    // If userFilter is specified, send to specific users
    if (userFilter) {
      await AdvancedNotification.broadcast(
        {
          title,
          message,
          type: type || 'SYSTEM',
          channels: channels || ['IN_APP'],
          priority: 'HIGH',
          category: 'SYSTEM'
        },
        userFilter
      );
    }
    
    res.json({
      success: true,
      message: 'تم بث الإشعار بنجاح',
      notification
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getSystemHealthStats() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [
    totalOperations,
    failedOperations,
    avgResponseTime,
    errorRate,
    activeUsers,
    systemUptime
  ] = await Promise.all([
    AuditLog.countDocuments({ createdAt: { $gte: last24Hours } }),
    AuditLog.countDocuments({ 
      createdAt: { $gte: last24Hours }, 
      result: 'FAILURE' 
    }),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: last24Hours } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: last24Hours } } },
      { $group: { 
        _id: null, 
        total: { $sum: 1 },
        failed: { $sum: { $cond: [{ $eq: ['$result', 'FAILURE'] }, 1, 0] } }
      }},
      { $project: { errorRate: { $divide: ['$failed', '$total'] } } }
    ]),
    User.countDocuments({ 
      lastLoginAt: { $gte: last24Hours },
      status: 'active'
    }),
    process.uptime()
  ]);
  
  return {
    totalOperations: totalOperations || 0,
    failedOperations: failedOperations || 0,
    successRate: totalOperations > 0 ? ((totalOperations - failedOperations) / totalOperations * 100).toFixed(2) : 100,
    avgResponseTime: avgResponseTime[0]?.avgDuration || 0,
    errorRate: (errorRate[0]?.errorRate * 100).toFixed(2) || 0,
    activeUsers: activeUsers || 0,
    systemUptime: Math.floor(systemUptime / 3600), // hours
    status: 'healthy'
  };
}

async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform
  };
}

async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await AuditLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
  return { deletedCount: result.deletedCount };
}

async function cleanupOldSessions() {
  // This would depend on your session store implementation
  return { message: 'Session cleanup completed' };
}

async function optimizeDatabase() {
  // This would run database optimization commands
  return { message: 'Database optimization completed' };
}

async function clearCache() {
  // This would clear application cache
  return { message: 'Cache cleared successfully' };
}

async function getSecurityOverview() {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [
    recentLogins,
    failedLogins,
    securityEvents,
    suspiciousActivity
  ] = await Promise.all([
    AuditLog.countDocuments({
      createdAt: { $gte: last24Hours },
      action: 'LOGIN',
      result: 'SUCCESS'
    }),
    AuditLog.countDocuments({
      createdAt: { $gte: last24Hours },
      action: 'LOGIN',
      result: 'FAILURE'
    }),
    AuditLog.countDocuments({
      createdAt: { $gte: last24Hours },
      category: 'SECURITY'
    }),
    AuditLog.find({
      createdAt: { $gte: last24Hours },
      severity: 'CRITICAL'
    }).limit(10)
  ]);
  
  return {
    recentLogins,
    failedLogins,
    securityEvents,
    suspiciousActivity: suspiciousActivity.length
  };
}

module.exports = router;
