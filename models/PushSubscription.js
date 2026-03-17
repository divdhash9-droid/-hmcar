// [[ARABIC_HEADER]] هذا الملف (models/PushSubscription.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

/**
 * PushSubscription Schema
 * تخزين اشتراكات Push API لكل مستخدم وأجهزته
 */
const pushSubscriptionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  deviceInfo: {
    browser: String,
    os: String,
    deviceId: String,
    lastUsedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// التأكد من عدم تكرار نفس الـ endpoint لنفس المستخدم
pushSubscriptionSchema.index({ user: 1, 'subscription.endpoint': 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
