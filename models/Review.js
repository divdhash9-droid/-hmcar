// [[ARABIC_HEADER]] هذا الملف (models/Review.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  response: {
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for better performance
reviewSchema.index({ car: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Prevent duplicate reviews
reviewSchema.index({ car: 1, user: 1 }, { unique: true });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static methods
reviewSchema.statics.getAverageRating = async function(carId) {
  const result = await this.aggregate([
    { $match: { car: new mongoose.Types.ObjectId(carId), status: 'approved' } },
    {
      $group: {
        _id: '$car',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { averageRating: 0, totalReviews: 0 };
};

reviewSchema.statics.getRatingDistribution = async function(carId) {
  return await this.aggregate([
    { $match: { car: new mongoose.Types.ObjectId(carId), status: 'approved' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

// Instance methods
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulUsers.includes(userId)) {
    this.helpfulUsers.push(userId);
    this.helpful += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.addResponse = function(content, authorId) {
  this.response = {
    content,
    author: authorId,
    createdAt: new Date()
  };
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);
