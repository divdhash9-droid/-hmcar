// [[ARABIC_HEADER]] هذا الملف (models/Report.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['sales', 'auctions', 'users', 'inventory', 'financial', 'performance'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parameters: {
    startDate: Date,
    endDate: Date,
    filters: mongoose.Schema.Types.Mixed,
    groupBy: String,
    metrics: [String]
  },
  data: {
    summary: mongoose.Schema.Types.Mixed,
    charts: [{
      type: {
        type: String,
        enum: ['bar', 'line', 'pie', 'doughnut', 'area']
      },
      title: String,
      data: mongoose.Schema.Types.Mixed,
      options: mongoose.Schema.Types.Mixed
    }],
    tables: [{
      title: String,
      headers: [String],
      rows: [[mongoose.Schema.Types.Mixed]],
      totals: mongoose.Schema.Types.Mixed
    }],
    insights: [{
      type: String,
      enum: ['trend_up', 'trend_down', 'anomaly', 'milestone', 'alert'],
      title: String,
      description: String,
      value: mongoose.Schema.Types.Mixed,
      change: Number,
      changePercent: Number
    }]
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'scheduled'],
    default: 'completed'
  },
  scheduledAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  fileUrl: String,
  fileSize: Number,
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ scheduledAt: 1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
reportSchema.statics.generateSalesReport = async function(parameters = {}) {
  const { startDate, endDate, groupBy = 'day' } = parameters;
  
  const Car = mongoose.model('Car');
  const SparePart = mongoose.model('SparePart');
  const Order = mongoose.model('Order');
  
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  // Sales data
  const salesData = await Order.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalSales: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Top selling items
  const topItems = await Order.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.item',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.price' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'cars',
        localField: '_id',
        foreignField: '_id',
        as: 'carDetails'
      }
    }
  ]);
  
  return {
    summary: {
      totalSales: salesData.reduce((sum, item) => sum + item.totalSales, 0),
      totalOrders: salesData.reduce((sum, item) => sum + item.orderCount, 0),
      avgOrderValue: salesData.reduce((sum, item) => sum + item.avgOrderValue, 0) / salesData.length || 0
    },
    charts: [{
      type: 'line',
      title: 'Sales Trend',
      data: salesData.map(item => ({
        date: `${item._id.year}-${item._id.month}-${item._id.day}`,
        sales: item.totalSales,
        orders: item.orderCount
      }))
    }],
    tables: [{
      title: 'Top Selling Items',
      headers: ['Item', 'Units Sold', 'Revenue'],
      rows: topItems.map(item => [
        item.carDetails[0]?.title || 'Unknown',
        item.totalSold,
        item.totalRevenue
      ])
    }]
  };
};

reportSchema.statics.generateAuctionReport = async function(parameters = {}) {
  const { startDate, endDate } = parameters;
  
  const Auction = mongoose.model('Auction');
  const Bid = mongoose.model('Bid');
  
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  const auctionData = await Auction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$startingPrice' }
      }
    }
  ]);
  
  const bidData = await Bid.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$auction',
        totalBids: { $sum: 1 },
        highestBid: { $max: '$amount' },
        avgBid: { $avg: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'auctions',
        localField: '_id',
        foreignField: '_id',
        as: 'auctionDetails'
      }
    },
    { $sort: { highestBid: -1 } },
    { $limit: 10 }
  ]);
  
  return {
    summary: {
      totalAuctions: auctionData.reduce((sum, item) => sum + item.count, 0),
      activeAuctions: auctionData.find(item => item._id === 'active')?.count || 0,
      completedAuctions: auctionData.find(item => item._id === 'completed')?.count || 0
    },
    charts: [{
      type: 'pie',
      title: 'Auction Status Distribution',
      data: auctionData.map(item => ({
        label: item._id,
        value: item.count
      }))
    }],
    tables: [{
      title: 'Top Auctions by Bids',
      headers: ['Auction', 'Total Bids', 'Highest Bid', 'Average Bid'],
      rows: bidData.map(item => [
        item.auctionDetails[0]?.title || 'Unknown',
        item.totalBids,
        item.highestBid,
        item.avgBid?.toFixed(2) || 0
      ])
    }]
  };
};

reportSchema.statics.generateUserReport = async function(parameters = {}) {
  const { startDate, endDate } = parameters;
  
  const User = mongoose.model('User');
  const Order = mongoose.model('Order');
  
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $gt: ['$lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  const topBuyers = await Order.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails'
      }
    }
  ]);
  
  return {
    summary: {
      totalUsers: userStats.reduce((sum, item) => sum + item.count, 0),
      activeUsers: userStats.reduce((sum, item) => sum + item.activeUsers, 0),
      adminUsers: userStats.find(item => item._id === 'admin')?.count || 0,
      buyerUsers: userStats.find(item => item._id === 'buyer')?.count || 0
    },
    charts: [{
      type: 'doughnut',
      title: 'User Distribution',
      data: userStats.map(item => ({
        label: item._id,
        value: item.count
      }))
    }],
    tables: [{
      title: 'Top Buyers by Spending',
      headers: ['User', 'Total Spent', 'Orders'],
      rows: topBuyers.map(item => [
        item.userDetails[0]?.name || 'Unknown',
        item.totalSpent,
        item.orderCount
      ])
    }]
  };
};

reportSchema.statics.generateFinancialReport = async function(parameters = {}) {
  const { startDate, endDate } = parameters;
  
  const Payment = mongoose.model('Payment');
  const Order = mongoose.model('Order');
  
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  const paymentStats = await Payment.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const revenueData = await Order.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const refunds = await Payment.aggregate([
    { $match: { ...dateFilter, 'refunds.0': { $exists: true } } },
    { $unwind: '$refunds' },
    {
      $group: {
        _id: null,
        totalRefunded: { $sum: '$refunds.amount' },
        refundCount: { $sum: 1 }
      }
    }
  ]);
  
  return {
    summary: {
      totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
      totalOrders: revenueData.reduce((sum, item) => sum + item.orders, 0),
      totalRefunded: refunds[0]?.totalRefunded || 0,
      netRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0) - (refunds[0]?.totalRefunded || 0)
    },
    charts: [{
      type: 'bar',
      title: 'Revenue by Month',
      data: revenueData.map(item => ({
        month: `${item._id.year}-${item._id.month}`,
        revenue: item.revenue
      }))
    }, {
      type: 'pie',
      title: 'Payment Methods',
      data: paymentStats.map(item => ({
        label: item._id,
        value: item.totalAmount
      }))
    }],
    tables: [{
      title: 'Payment Method Statistics',
      headers: ['Method', 'Transactions', 'Total Amount'],
      rows: paymentStats.map(item => [
        item._id,
        item.count,
        item.totalAmount
      ])
    }]
  };
};

module.exports = mongoose.model('Report', reportSchema);
