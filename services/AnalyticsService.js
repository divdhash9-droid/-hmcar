// [[ARABIC_HEADER]] هذا الملف (services/AnalyticsService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const User = require('../models/User');
const Auction = require('../models/Auction');
const Car = require('../models/Car');
const Bid = require('../models/Bid');
const Order = require('../models/Order');

const AuditLog = require('../models/AuditLog');

class AnalyticsService {
  // [[ARABIC_COMMENT]] تحديد بداية النطاق الزمني حسب الفترة المطلوبة في التقارير
  // week = آخر 7 أيام، month = آخر 30 يوم، year = آخر 365 يوم
  // fallbackMonths يستخدم عندما نريد نطاقاً افتراضياً (مثل آخر 6 أشهر)
  static getPeriodStart(period, fallbackMonths = 0) {
    if (!period || period === 'all') {
      if (!fallbackMonths) return null;
      const d = new Date();
      d.setMonth(d.getMonth() - fallbackMonths);
      return d;
    }

    const now = Date.now();
    if (period === 'week') return new Date(now - 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return new Date(now - 30 * 24 * 60 * 60 * 1000);
    if (period === 'year') return new Date(now - 365 * 24 * 60 * 60 * 1000);
    return null;
  }

  static async getSummary(period = 'all') {
    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const periodStart = this.getPeriodStart(period, 0);
    const orderDateFilter = periodStart ? { createdAt: { $gte: periodStart } } : {};
    const orderRevenueMatch = periodStart
      ? { createdAt: { $gte: periodStart }, status: { $in: ['confirmed', 'shipped', 'completed'] } }
      : { status: { $in: ['confirmed', 'shipped', 'completed'] } };

    const [
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
      Order.countDocuments(orderDateFilter),
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

    // [[ARABIC_COMMENT]] إحصاء آخر 7 أيام (ثابت للـ KPI السريع)،
    // مع تحويل الإيراد إلى USD/KRW اعتماداً على exchangeSnapshot المخزن داخل كل طلب
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [ordersLast7, revenueLast7] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: last7 } }),
      (async () => {
        const r = await Order.aggregate([
          { $match: { createdAt: { $gte: last7 }, status: { $in: ['confirmed', 'shipped', 'completed'] } } },
          {
            $group: {
              _id: null,
              totalSar: {
                $sum: {
                  $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }]
                }
              },
              totalUsd: {
                $sum: {
                  $divide: [
                    { $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }] },
                    { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
                  ]
                }
              },
              totalKrw: {
                $sum: {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }] },
                        { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
                      ]
                    },
                    { $ifNull: ['$pricing.exchangeSnapshot.usdToKrw', 1350] }
                  ]
                }
              }
            }
          }
        ]);
        return {
          sar: (r[0] && r[0].totalSar) ? Number(r[0].totalSar) : 0,
          usd: (r[0] && r[0].totalUsd) ? Number(r[0].totalUsd.toFixed(2)) : 0,
          krw: (r[0] && r[0].totalKrw) ? Number(r[0].totalKrw.toFixed(0)) : 0,
        };
      })()
    ]);

    // [[ARABIC_COMMENT]] إجمالي الإيرادات للفترة المختارة
    // المصدر الأساسي: pricing.grandTotalSar
    // fallback: totalAmount (للتوافق مع الطلبات القديمة)
    // التحويل إلى USD/KRW يتم من سعر الصرف الموثّق داخل نفس الطلب (snapshot)
    const totalRevenueRes = await Order.aggregate([
      { $match: orderRevenueMatch },
      {
        $group: {
          _id: null,
          totalSar: {
            $sum: {
              $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }]
            }
          },
          totalUsd: {
            $sum: {
              $divide: [
                { $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }] },
                { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
              ]
            }
          },
          totalKrw: {
            $sum: {
              $multiply: [
                {
                  $divide: [
                    { $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }] },
                    { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
                  ]
                },
                { $ifNull: ['$pricing.exchangeSnapshot.usdToKrw', 1350] }
              ]
            }
          }
        }
      }
    ]);
    const totalRevenue = (totalRevenueRes[0] && totalRevenueRes[0].totalSar) ? Number(totalRevenueRes[0].totalSar) : 0;
    const totalRevenueUsd = (totalRevenueRes[0] && totalRevenueRes[0].totalUsd) ? Number(totalRevenueRes[0].totalUsd.toFixed(2)) : 0;
    const totalRevenueKrw = (totalRevenueRes[0] && totalRevenueRes[0].totalKrw) ? Number(totalRevenueRes[0].totalKrw.toFixed(0)) : 0;

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
      revenueLast7: revenueLast7.sar,
      revenueLast7Usd: revenueLast7.usd,
      revenueLast7Krw: revenueLast7.krw,
      totalRevenue,
      totalRevenueUsd,
      totalRevenueKrw,
      totalBrands,
      totalParts,
      newContacts,
      period,
      periodStart,
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

  static async getMonthlyStats(period = 'all') {
    // [[ARABIC_COMMENT]] في حالة all نعرض آخر 6 أشهر،
    // أما باقي الفترات فنستخدم بداية الفترة نفسها.
    const periodStart = this.getPeriodStart(period, period === 'all' ? 6 : 0) || this.getPeriodStart('all', 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart },
          status: { $in: ['confirmed', 'shipped', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: {
            $sum: {
              $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }]
            }
          },
          revenueUsd: {
            $sum: {
              $divide: [
                { $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }] },
                { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
              ]
            }
          },
          revenueKrw: {
            $sum: {
              $multiply: [
                {
                  $divide: [
                    { $ifNull: ['$pricing.grandTotalSar', { $ifNull: ['$totalAmount', 0] }] },
                    { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
                  ]
                },
                { $ifNull: ['$pricing.exchangeSnapshot.usdToKrw', 1350] }
              ]
            }
          },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyCars = await Car.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart },
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

    // [[ARABIC_COMMENT]] أعلى العناصر مبيعاً (Top Cars) من الطلبات المؤكدة/المشحونة/المكتملة
    // الفكرة: نفك عناصر الطلبات (items) ثم نجمع الكمية والإيراد لكل titleSnapshot
    // مع حساب الإيراد متعدد العملات بناءً على snapshot لكل طلب.
    const topCars = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart },
          status: { $in: ['confirmed', 'shipped', 'completed'] },
          items: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$items' },
      {
        // [[ARABIC_COMMENT]] تجهيز قيم آمنة قبل التجميع لتفادي null/undefined
        $addFields: {
          safeQty: { $ifNull: ['$items.qty', 1] },
          safeUsdToSar: { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] },
          safeUsdToKrw: { $ifNull: ['$pricing.exchangeSnapshot.usdToKrw', 1350] },
          unitSarResolved: {
            $ifNull: [
              '$items.unitPriceSar',
              {
                $multiply: [
                  { $ifNull: ['$items.unitPriceUsd', 0] },
                  { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
                ]
              }
            ]
          },
          unitUsdResolved: {
            $ifNull: [
              '$items.unitPriceUsd',
              {
                $divide: [
                  { $ifNull: ['$items.unitPriceSar', 0] },
                  { $ifNull: ['$pricing.exchangeSnapshot.usdToSar', 3.75] }
                ]
              }
            ]
          }
        }
      },
      {
        // [[ARABIC_COMMENT]] تجميع حسب اسم العنصر وقت الشراء (titleSnapshot)
        $group: {
          _id: '$items.titleSnapshot',
          sales: { $sum: '$safeQty' },
          revenueSar: { $sum: { $multiply: ['$unitSarResolved', '$safeQty'] } },
          revenueUsd: { $sum: { $multiply: ['$unitUsdResolved', '$safeQty'] } },
          revenueKrw: {
            $sum: {
              $multiply: [
                '$unitUsdResolved',
                '$safeUsdToKrw',
                '$safeQty'
              ]
            }
          }
        }
      },
      // [[ARABIC_COMMENT]] ترتيب حسب إيراد SAR تنازلياً ثم أخذ أعلى 10
      { $sort: { revenueSar: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          sales: 1,
          revenueSar: 1,
          revenueUsd: 1,
          revenueKrw: 1
        }
      }
    ]);

    return {
      monthlyRevenue,
      monthlyCars,
      topCars,
      period,
      periodStart
    };
  }
}

module.exports = AnalyticsService;
