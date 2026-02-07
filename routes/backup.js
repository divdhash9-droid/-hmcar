// [[ARABIC_HEADER]] هذا الملف (routes/backup.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Backup = require('../models/Backup');
const { requireAuth } = require('../middleware/auth');
// const { requirePermission } = require('../middleware/permissions');
const fs = require('fs');
const path = require('path');

// Middleware للتحقق من صلاحية إدارة النسخ الاحتياطي
const requireBackupPermission = [requireAuth, requirePermission('manage_settings')];

// Get all backups
router.get('/', requireBackupPermission, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      search
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [backups, total] = await Promise.all([
      Backup.find(filter)
        .populate('createdBy', 'name email')
        .populate('parentBackup', 'name createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip(skip),
      Backup.countDocuments(filter)
    ]);

    // Get statistics
    const stats = await getBackupStats();

    res.json({
      success: true,
      backups,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific backup
router.get('/:id', requireBackupPermission, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('parentBackup', 'name createdAt')
      .populate('childBackups', 'name createdAt status')
      .populate('restore.restoreHistory.restoredBy', 'name email');
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }
    
    res.json({
      success: true,
      backup
    });
  } catch (error) {
    console.error('Error fetching backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new backup
router.post('/create', requireBackupPermission, async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'FULL',
      collections,
      settings,
      schedule
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'اسم النسخة الاحتياطية مطلوب' });
    }

    const backupData = {
      name,
      description,
      type,
      collections: collections || [],
      settings: settings || {},
      schedule: schedule || {}
    };

    const backup = await Backup.createBackup(backupData, req.user._id);
    
    res.status(201).json({
      success: true,
      backup: await Backup.findById(backup._id).populate('createdBy', 'name email')
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Restore backup
router.post('/:id/restore', requireBackupPermission, async (req, res) => {
  try {
    const { collections } = req.body;
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }

    if (backup.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'لا يمكن استعادة نسخة احتياطية غير مكتملة' });
    }

    const restoreInfo = await backup.restoreBackup(collections, req.user._id);
    
    res.json({
      success: true,
      message: 'تم بدء عملية الاستعادة',
      restoreInfo
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete backup
router.delete('/:id', requireBackupPermission, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }

    if (backup.status === 'RUNNING') {
      return res.status(400).json({ error: 'لا يمكن حذف نسخة احتياطية قيد التشغيل' });
    }

    await backup.delete();
    
    res.json({
      success: true,
      message: 'تم حذف النسخة الاحتياطية بنجاح'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel backup
router.post('/:id/cancel', requireBackupPermission, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }

    if (backup.status !== 'RUNNING' && backup.status !== 'PENDING') {
      return res.status(400).json({ error: 'لا يمكن إلغاء نسخة احتياطية ليست قيد التشغيل' });
    }

    backup.status = 'CANCELLED';
    backup.stats.endTime = new Date();
    await backup.save();
    
    res.json({
      success: true,
      message: 'تم إلغاء النسخة الاحتياطية'
    });
  } catch (error) {
    console.error('Error cancelling backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify backup
router.post('/:id/verify', requireBackupPermission, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }

    const verified = await backup.verify();
    
    res.json({
      success: true,
      verified,
      verification: backup.verification
    });
  } catch (error) {
    console.error('Error verifying backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule backup
router.post('/:id/schedule', requireBackupPermission, async (req, res) => {
  try {
    const { frequency, enabled } = req.body;
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }

    backup.schedule.enabled = enabled !== false;
    if (frequency) {
      backup.schedule.frequency = frequency;
    }
    
    if (backup.schedule.enabled) {
      // حساب وقت التشغيل التالي
      const now = new Date();
      switch (backup.schedule.frequency) {
        case 'HOURLY':
          backup.schedule.nextRun = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case 'DAILY':
          backup.schedule.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'WEEKLY':
          backup.schedule.nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'MONTHLY':
          backup.schedule.nextRun = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'YEARLY':
          backup.schedule.nextRun = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    await backup.save();
    
    res.json({
      success: true,
      schedule: backup.schedule
    });
  } catch (error) {
    console.error('Error scheduling backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get backup statistics
router.get('/stats/overview', requireBackupPermission, async (req, res) => {
  try {
    const stats = await getBackupStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download backup
router.get('/:id/download', requireBackupPermission, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }

    if (backup.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'النسخة الاحتياطية غير مكتملة' });
    }

    if (!backup.file.path || !fs.existsSync(backup.file.path)) {
      return res.status(404).json({ error: 'ملف النسخة الاحتياطية غير موجود' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.file.name}"`);
    
    const fileStream = fs.createReadStream(backup.file.path);
    fileStream.pipe(res);
    
    // تحديث عداد التنزيلات
    backup.downloadCount = (backup.downloadCount || 0) + 1;
    await backup.save();
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup old backups
router.post('/cleanup', requireBackupPermission, async (req, res) => {
  try {
    const deletedCount = await Backup.cleanupOldBackups();
    
    res.json({
      success: true,
      message: `تم حذف ${deletedCount} نسخة احتياطية قديمة`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scheduled backups
router.get('/scheduled/list', requireBackupPermission, async (req, res) => {
  try {
    const scheduledBackups = await Backup.find({
      'schedule.enabled': true
    })
    .populate('createdBy', 'name email')
    .sort({ 'schedule.nextRun': 1 });
    
    res.json({
      success: true,
      scheduledBackups
    });
  } catch (error) {
    console.error('Error fetching scheduled backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system storage info
router.get('/storage/info', requireBackupPermission, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    let totalSize = 0;
    let fileCount = 0;
    
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      
      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        }
      }
    }
    
    // Get database size
    const dbStats = await mongoose.connection.db.stats();
    
    res.json({
      success: true,
      storage: {
        backupDirectory: backupDir,
        totalSize,
        fileCount,
        databaseSize: dbStats.dataSize,
        databaseStorageSize: dbStats.storageSize
      }
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getBackupStats() {
  const [
    totalBackups,
    completedBackups,
    failedBackups,
    runningBackups,
    scheduledBackups,
    totalSize,
    avgDuration
  ] = await Promise.all([
    Backup.countDocuments(),
    Backup.countDocuments({ status: 'COMPLETED' }),
    Backup.countDocuments({ status: 'FAILED' }),
    Backup.countDocuments({ status: 'RUNNING' }),
    Backup.countDocuments({ 'schedule.enabled': true }),
    Backup.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalSize: { $sum: '$file.size' } } }
    ]),
    Backup.aggregate([
      { $match: { status: 'COMPLETED', 'stats.duration': { $exists: true } } },
      { $group: { _id: null, avgDuration: { $avg: '$stats.duration' } } }
    ])
  ]);

  return {
    totalBackups,
    completedBackups,
    failedBackups,
    runningBackups,
    scheduledBackups,
    totalSize: totalSize[0]?.totalSize || 0,
    avgDuration: avgDuration[0]?.avgDuration || 0,
    successRate: totalBackups > 0 ? (completedBackups / totalBackups * 100).toFixed(2) : 0
  };
}

module.exports = router;
