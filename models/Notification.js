// models/Notification.js
const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  // المستخدم الذي قام باختيار السيارة (عادة عميل)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // السيارة التي تم اختيارها
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  // حالة الإشعار: new لم تتم المتابعة، seen تمت المتابعة من الإدارة
  status: { type: String, enum: ['new', 'seen'], default: 'new' }
}, { timestamps: true });
module.exports = mongoose.model('Notification', notificationSchema);
