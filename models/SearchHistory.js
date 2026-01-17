// [[ARABIC_HEADER]] هذا الملف (models/SearchHistory.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  filters: {
    priceMin: Number,
    priceMax: Number,
    yearMin: Number,
    yearMax: Number,
    make: String,
    model: String,
    category: String,
    fuelType: String,
    transmission: String,
    location: String
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  searchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// فهرسة للبحث السريع
searchHistorySchema.index({ user: 1, searchedAt: -1 });
searchHistorySchema.index({ query: 'text' });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
