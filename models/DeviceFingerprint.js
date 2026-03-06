// [[ARABIC_HEADER]] هذا الملف (models/DeviceFingerprint.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const deviceFingerprintSchema = new mongoose.Schema({
    ip: { type: String, required: true, index: true },
    deviceId: { type: String, default: '' },
    linkedUsername: { type: String, required: true }, // الاسم أو الرقم الذي تم الدخول به بنجاح لأول مرة
    banned: { type: Boolean, default: false },
    banCode: { type: String, default: '' },
    failedAttempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: Date.now },
    unbannedAt: { type: Date, default: null },
    unbannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('DeviceFingerprint', deviceFingerprintSchema);
