// [[ARABIC_HEADER]] هذا الملف (services/AnalyticsService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const User = require('../models/User');
const Auction = require('../models/Auction');
const Car = require('../models/Car');
const Bid = require('../models/Bid');
const Order = require('../models/Order');

const AuditLog = require('../models/AuditLog');

class AnalyticsService {
  static async getSummary() {
    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalBids,
      bidsLast24h,
      avgBid,
      totalBrands,
      totalParts,
      newContacts
    ] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Car.countDocuments({ isSold: true }),
      Auction.countDocuments(),
      Auction.countDocuments({ status: 'running' }),
      Auction.countDocuments({ status: 'scheduled' }),
      Order.countDocuments(),
      Bid.countDocuments(),
      Bid.countDocuments({ createdAt: { $gte: last24 } }),
      // average bid amount
      (async () => {
        const res = await Bid.aggregate([
          { $group: { _id: null, avg: { $avg: '$amount' } } }
        ]);
        return (res[0] && res[0].avg) ? Number(res[0].avg.toFixed(2)) : 0;
      })(),
      require('../models/Brand').countDocuments(),
      require('../models/SparePart').countDocuments(),
      require('../models/Contact').countDocuments({ status: 'new' })
    ]);

    // recent orders and revenue (last 7 days)
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [ordersLast7, revenueLast7] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: last7 } }),
      (async () => {
        const r = await Order.aggregate([
          { $match: { createdAt: { $gte: last7 }, status: { $in: ['confirmed', 'shipped', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        return (r[0] && r[0].total) ? Number(r[0].total) : 0;
      })()
    ]);

    // Get total revenue
    const totalRevenueRes = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'shipped', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = (totalRevenueRes[0] && totalRevenueRes[0].total) ? Number(totalRevenueRes[0].total) : 0;

    return {
      totalUsers,
      totalCars,
      carsSold,
      totalAuctions,
      runningAuctions,
      scheduledAuctions,
      totalOrders,
      totalBids,
      bidsLast24h,
      avgBid,
      ordersLast7,
      revenueLast7,
      totalRevenue,
      totalBrands,
      totalParts,
      newContacts,
      generatedAt: now
    };
  }

  static async getRecentActivities(limit = 10) {
    return await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .lean();
  }

  static async getMonthlyStats() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['confirmed', 'shipped', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyCars = await Car.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          isSold: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    return {
      monthlyRevenue,
      monthlyCars
    };
  }
}

module.exports = AnalyticsService;
