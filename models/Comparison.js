// [[ARABIC_HEADER]] هذا الملف (models/Comparison.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'مقارنة جديدة'
  },
  cars: [{
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
comparisonSchema.index({ user: 1, status: 1 });
comparisonSchema.index({ 'cars.car': 1 });
comparisonSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for car count
comparisonSchema.virtual('carCount').get(function() {
  return this.cars.length;
});

// تحديد أقصى عدد للسيارات في المقارنة
comparisonSchema.pre('save', function(next) {
  if (this.cars.length > 5) {
    const error = new Error('لا يمكن مقارنة أكثر من 5 سيارات في نفس الوقت');
    return next(error);
  }
  next();
});

// Static methods
comparisonSchema.statics.findByUser = function(userId, status = 'active') {
  return this.find({ user: userId, status })
    .populate('cars.car', 'title price images year brand model specifications')
    .sort({ updatedAt: -1 });
};

comparisonSchema.statics.findPublic = function(limit = 20) {
  return this.find({ isPublic: true, status: 'active' })
    .populate('user', 'name')
    .populate('cars.car', 'title price images year brand model')
    .sort({ createdAt: -1 })
    .limit(limit);
};

comparisonSchema.statics.findByShareToken = function(token) {
  return this.findOne({ shareToken: token, isPublic: true })
    .populate('user', 'name')
    .populate('cars.car', 'title price images year brand model specifications')
    .populate('winner', 'title price images year brand model');
};

// Instance methods - دوال المثيل (تعمل على كائن المقارنة)
comparisonSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(32).toString('hex');
  return this.save();
};

comparisonSchema.methods.addCar = function(carId, notes = '') {
  // التحقق من وجود السيارة مسبقاً
  const existingCar = this.cars.find(c => c.car.toString() === carId.toString());
  if (existingCar) {
    existingCar.notes = notes;
  } else {
    this.cars.push({ car: carId, notes });
  }
  return this.save();
};

comparisonSchema.methods.removeCar = function(carId) {
  this.cars = this.cars.filter(c => c.car.toString() !== carId.toString());
  return this.save();
};

comparisonSchema.methods.setWinner = function(carId) {
  this.winner = carId;
  this.status = 'completed';
  return this.save();
};

comparisonSchema.methods.getComparisonData = async function() {
  const Car = mongoose.model('Car');
  const cars = await Car.find({
    '_id': { $in: this.cars.map(c => c.car) }
  });

  return {
    comparison: this,
    cars: cars.map(car => {
      const comparisonCar = this.cars.find(c => c.car.toString() === car._id.toString());
      return {
        ...car.toObject(),
        notes: comparisonCar?.notes || '',
        addedAt: comparisonCar?.addedAt
      };
    })
  };
};

module.exports = mongoose.model('Comparison', comparisonSchema);
