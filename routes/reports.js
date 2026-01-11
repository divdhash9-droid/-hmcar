const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all reports (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const reports = await Report.find(filter)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Report.countDocuments(filter);
    
    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate new report
router.post('/generate', adminAuth, async (req, res) => {
  try {
    const { name, type, parameters } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'اسم ونوع التقرير مطلوبان' });
    }
    
    let reportData;
    
    switch (type) {
      case 'sales':
        reportData = await Report.generateSalesReport(parameters);
        break;
      case 'auctions':
        reportData = await Report.generateAuctionReport(parameters);
        break;
      case 'users':
        reportData = await Report.generateUserReport(parameters);
        break;
      case 'financial':
        reportData = await Report.generateFinancialReport(parameters);
        break;
      default:
        return res.status(400).json({ error: 'نوع التقرير غير مدعوم' });
    }
    
    const report = new Report({
      name,
      type,
      description: parameters.description || '',
      generatedBy: req.user._id,
      parameters,
      data: reportData,
      status: 'completed'
    });
    
    await report.save();
    
    res.status(201).json({
      success: true,
      report: await Report.findById(report._id).populate('generatedBy', 'name email')
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific report
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({ error: 'التقرير غير موجود' });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete report
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'التقرير غير موجود' });
    }
    
    res.json({
      success: true,
      message: 'تم حذف التقرير بنجاح'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download report as PDF/Excel
router.get('/:id/download', adminAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'التقرير غير موجود' });
    }
    
    // Increment download count
    report.downloadCount += 1;
    await report.save();
    
    // Generate file based on format
    const format = req.query.format || 'pdf';
    
    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await generateExcelReport(report);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.xlsx"`);
      res.send(excelBuffer);
    } else {
      res.status(400).json({ error: 'تنسيق الملف غير مدعوم' });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule report
router.post('/:id/schedule', adminAuth, async (req, res) => {
  try {
    const { scheduledAt, frequency } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { 
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled'
      },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ error: 'التقرير غير موجود' });
    }
    
    // Schedule the report generation
    if (frequency) {
      scheduleReportGeneration(report._id, frequency);
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error scheduling report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // Default to last 30 days
    
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    // Get various statistics
    const stats = await Promise.all([
      getSalesStats(startDate, endDate),
      getAuctionStats(startDate, endDate),
      getUserStats(startDate, endDate),
      getFinancialStats(startDate, endDate)
    ]);
    
    const [salesStats, auctionStats, userStats, financialStats] = stats;
    
    res.json({
      success: true,
      stats: {
        sales: salesStats,
        auctions: auctionStats,
        users: userStats,
        financial: financialStats,
        period: `${period} days`
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available report types
router.get('/types', adminAuth, async (req, res) => {
  try {
    const reportTypes = [
      {
        id: 'sales',
        name: 'تقرير المبيعات',
        description: 'تحليل المبيعات والطلبات',
        icon: 'shopping-cart',
        metrics: ['totalSales', 'orderCount', 'avgOrderValue', 'topItems'],
        filters: ['dateRange', 'status', 'paymentMethod']
      },
      {
        id: 'auctions',
        name: 'تقرير المزادات',
        description: 'تحليل أداء المزادات',
        icon: 'gavel',
        metrics: ['totalAuctions', 'activeAuctions', 'completedAuctions', 'topBids'],
        filters: ['dateRange', 'status', 'category']
      },
      {
        id: 'users',
        name: 'تقرير المستخدمين',
        description: 'إحصائيات المستخدمين والنشاط',
        icon: 'users',
        metrics: ['totalUsers', 'activeUsers', 'newUsers', 'topBuyers'],
        filters: ['dateRange', 'role', 'status']
      },
      {
        id: 'financial',
        name: 'تقرير مالي',
        description: 'تحليل الإيرادات والمصروفات',
        icon: 'dollar-sign',
        metrics: ['totalRevenue', 'netRevenue', 'refunds', 'paymentMethods'],
        filters: ['dateRange', 'paymentMethod', 'status']
      },
      {
        id: 'inventory',
        name: 'تقرير المخزون',
        description: 'حالة السيارات وقطع الغيار',
        icon: 'warehouse',
        metrics: ['totalItems', 'availableItems', 'soldItems', 'lowStock'],
        filters: ['category', 'brand', 'status']
      },
      {
        id: 'performance',
        name: 'تقرير الأداء',
        description: 'مؤشرات أداء النظام',
        icon: 'chart-line',
        metrics: ['responseTime', 'conversionRate', 'userSatisfaction', 'systemUptime'],
        filters: ['dateRange', 'metric']
      }
    ];
    
    res.json({
      success: true,
      types: reportTypes
    });
  } catch (error) {
    console.error('Error fetching report types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getSalesStats(startDate, endDate) {
  const Order = mongoose.model('Order');
  
  const stats = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
  
  return stats[0] || { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
}

async function getAuctionStats(startDate, endDate) {
  const Auction = mongoose.model('Auction');
  
  const stats = await Auction.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
}

async function getUserStats(startDate, endDate) {
  const User = mongoose.model('User');
  
  const stats = await User.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
}

async function getFinancialStats(startDate, endDate) {
  const Payment = mongoose.model('Payment');
  
  const stats = await Payment.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats[0] || { totalRevenue: 0, transactionCount: 0 };
}

async function generatePDFReport(report) {
  // This would use a PDF library like puppeteer or jsPDF
  // For now, return a placeholder
  return Buffer.from('PDF report data');
}

async function generateExcelReport(report) {
  // This would use an Excel library like exceljs
  // For now, return a placeholder
  return Buffer.from('Excel report data');
}

function scheduleReportGeneration(reportId, frequency) {
  // This would use a job scheduler like node-cron
  console.log(`Scheduling report ${reportId} with frequency ${frequency}`);
}

module.exports = router;
