// [[ARABIC_HEADER]] هذا الملف (models/Analytics.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['page_view', 'car_view', 'search', 'auction_bid', 'user_registration', 'order_created', 'review_posted']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: {
    type: String,
    required: true
  },
  data: {
    // Common fields
    url: String,
    userAgent: String,
    ip: String,
    referrer: String,
    
    // Specific data based on type
    carId: mongoose.Schema.Types.ObjectId,
    searchQuery: String,
    searchFilters: mongoose.Schema.Types.Mixed,
    bidAmount: Number,
    auctionId: mongoose.Schema.Types.ObjectId,
    orderId: mongoose.Schema.Types.ObjectId,
    reviewId: mongoose.Schema.Types.ObjectId,
    
    // Performance metrics
    loadTime: Number,
    renderTime: Number,
    
    // Device info
    device: String,
    browser: String,
    os: String,
    screenResolution: String,
    
    // Location data (if available)
    country: String,
    city: String,
    
    // Custom properties
    customProperties: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
analyticsSchema.index({ type: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });
analyticsSchema.index({ 'data.carId': 1, timestamp: -1 });
analyticsSchema.index({ 'data.auctionId': 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

// Static methods for analytics
analyticsSchema.statics.getMetrics = async function(startDate, endDate, filters = {}) {
  const matchStage = {
    timestamp: { $gte: startDate, $lte: endDate }
  };

  if (filters.type) {
    matchStage.type = filters.type;
  }

  if (filters.userId) {
    matchStage.userId = new mongoose.Types.ObjectId(filters.userId);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ];

  return await this.aggregate(pipeline);
};

analyticsSchema.statics.getPageViews = async function(startDate, endDate, limit = 10) {
  return await this.aggregate([
    {
      $match: {
        type: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$data.url',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        url: '$_id',
        views: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { views: -1 } },
    { $limit: limit }
  ]);
};

analyticsSchema.statics.getPopularCars = async function(startDate, endDate, limit = 10) {
  return await this.aggregate([
    {
      $match: {
        type: 'car_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$data.carId',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        carId: '$_id',
        views: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { views: -1 } },
    { $limit: limit }
  ]);
};

analyticsSchema.statics.getSearchAnalytics = async function(startDate, endDate, limit = 20) {
  return await this.aggregate([
    {
      $match: {
        type: 'search',
        timestamp: { $gte: startDate, $lte: endDate },
        'data.searchQuery': { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$data.searchQuery',
        searches: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgResults: { $avg: '$data.searchResultsCount' }
      }
    },
    {
      $project: {
        query: '$_id',
        searches: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgResults: { $round: ['$avgResults', 0] },
        _id: 0
      }
    },
    { $sort: { searches: -1 } },
    { $limit: limit }
  ]);
};

analyticsSchema.statics.getUserActivity = async function(startDate, endDate, limit = 10) {
  return await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        userId: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$userId',
        activities: { $sum: 1 },
        sessionCount: { $addToSet: '$sessionId' },
        types: { $addToSet: '$type' },
        firstActivity: { $min: '$timestamp' },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        userId: '$_id',
        activities: 1,
        sessionCount: { $size: '$sessionCount' },
        activityTypes: { $size: '$types' },
        duration: {
          $divide: [
            { $subtract: ['$lastActivity', '$firstActivity'] },
            1000 * 60 * 60 // Convert to hours
          ]
        },
        _id: 0
      }
    },
    { $sort: { activities: -1 } },
    { $limit: limit }
  ]);
};

analyticsSchema.statics.getDeviceAnalytics = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        'data.device': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$data.device',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        device: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

analyticsSchema.statics.getTimeSeriesData = async function(startDate, endDate, interval = 'hour', type = null) {
  const groupBy = {};
  
  switch (interval) {
    case 'minute':
      groupBy.year = { $year: '$timestamp' };
      groupBy.month = { $month: '$timestamp' };
      groupBy.day = { $dayOfMonth: '$timestamp' };
      groupBy.hour = { $hour: '$timestamp' };
      groupBy.minute = { $minute: '$timestamp' };
      break;
    case 'hour':
      groupBy.year = { $year: '$timestamp' };
      groupBy.month = { $month: '$timestamp' };
      groupBy.day = { $dayOfMonth: '$timestamp' };
      groupBy.hour = { $hour: '$timestamp' };
      break;
    case 'day':
      groupBy.year = { $year: '$timestamp' };
      groupBy.month = { $month: '$timestamp' };
      groupBy.day = { $dayOfMonth: '$timestamp' };
      break;
    case 'month':
      groupBy.year = { $year: '$timestamp' };
      groupBy.month = { $month: '$timestamp' };
      break;
  }

  const matchStage = {
    timestamp: { $gte: startDate, $lte: endDate }
  };

  if (type) {
    matchStage.type = type;
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        timestamp: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
        _id: 0
      }
    },
    { $sort: { 'timestamp': 1 } }
  ]);
};

analyticsSchema.statics.getConversionFunnel = async function(startDate, endDate) {
  const funnelSteps = [
    { type: 'page_view', name: 'Page Views' },
    { type: 'search', name: 'Searches' },
    { type: 'car_view', name: 'Car Views' },
    { type: 'auction_bid', name: 'Auction Bids' },
    { type: 'order_created', name: 'Orders' }
  ];

  const results = [];
  
  for (const step of funnelSteps) {
    const count = await this.countDocuments({
      type: step.type,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    const uniqueUsers = await this.distinct('userId', {
      type: step.type,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    results.push({
      step: step.name,
      type: step.type,
      totalEvents: count,
      uniqueUsers: uniqueUsers.length,
      conversionRate: results.length > 0 ? 
        (uniqueUsers.length / results[0].uniqueUsers * 100).toFixed(2) : 100
    });
  }

  return results;
};

// Instance method to track analytics
analyticsSchema.statics.track = async function(type, data, userId = null, sessionId = null) {
  try {
    const analytics = new this({
      type,
      userId,
      sessionId: sessionId || this.generateSessionId(),
      data
    });

    await analytics.save();
    return analytics;
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return null;
  }
};

analyticsSchema.statics.generateSessionId = function() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
