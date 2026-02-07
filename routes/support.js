// [[ARABIC_HEADER]] هذا الملف (routes/support.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');

// مسارات الدعم (Support):
// - GET /support : عرض نموذج التواصل
// - POST /support : حفظ رسالة الدعم في قاعدة البيانات ثم إعادة التوجيه مع success=1

router.get('/', (req, res) => {
  // صفحة نموذج التواصل مع الدعم + إظهار رسالة نجاح عند success=1 (بعد إرسال النموذج)
  res.render('support/index', { submitted: req.query.success === '1' });
});

router.post('/', async (req, res) => {
  // استقبال رسالة دعم من العميل وحفظها في قاعدة البيانات ثم إعادة التوجيه مع success
  // ملاحظة: يتم عرض الرسائل داخل لوحة الإدارة في صفحة admin/support
  const { name, phone, subject, message } = req.body;
  await SupportMessage.create({ name, phone, subject, message });
  res.redirect('/support?success=1');
});

module.exports = router;
