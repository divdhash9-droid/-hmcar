// [[ARABIC_HEADER]] هذا الملف (models/Notification.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Notification.js
const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  // المستخدم الذي يستقبل الإشعار
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // السيارة المرتبطة (اختياري)
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  // عنوان الإشعار
  title: { type: String, required: true },
  // محتوى الرسالة
  message: { type: String, required: true },
  // نوع الإشعار: info, success, warning, error
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  // رابط للتوجيه عند النقر (اختياري)
  link: { type: String },
  // حالة الإشعار: new لم تتم المتابعة، seen تمت المتابعة من الإدارة
  status: { type: String, enum: ['new', 'seen'], default: 'new' },
  // هل تم قراءة الإشعار من قبل المستخدم
  read: { type: Boolean, default: false },
  // تاريخ القراءة
  readAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
