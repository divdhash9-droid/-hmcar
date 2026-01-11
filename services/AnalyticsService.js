const User = require('../models/User');
const Auction = require('../models/Auction');
const Car = require('../models/Car');
const Bid = require('../models/Bid');
const Order = require('../models/Order');

class AnalyticsService {
  static async getSummary() {
    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCars,
      carsSold,
      totalAuctions,
      runningAuctions,
      scheduledAuctions,
      totalBids,
      bidsLast24h,
      avgBid
    ] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Car.countDocuments({ isSold: true }),
      Auction.countDocuments(),
      Auction.countDocuments({ status: 'running' }),
      Auction.countDocuments({ status: 'scheduled' }),
      Bid.countDocuments(),
      Bid.countDocuments({ createdAt: { $gte: last24 } }),
      // average bid amount
      (async () => {
        const res = await Bid.aggregate([
          { $group: { _id: null, avg: { $avg: '$amount' } } }
        ]);
        return (res[0] && res[0].avg) ? Number(res[0].avg.toFixed(2)) : 0;
      })()
    ]);

    // recent orders and revenue (last 7 days)
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [ordersLast7, revenueLast7] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: last7 } }),
      (async () => {
        const r = await Order.aggregate([
          { $match: { createdAt: { $gte: last7 }, status: { $in: ['confirmed','shipped','completed'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        return (r[0] && r[0].total) ? Number(r[0].total) : 0;
      })()
    ]);

    return {
      totalUsers,
      totalCars,
      carsSold,
      totalAuctions,
      runningAuctions,
      scheduledAuctions,
      totalBids,
      bidsLast24h,
      avgBid,
      ordersLast7,
      revenueLast7,
      generatedAt: now
    };
  }
}

module.exports = AnalyticsService;
