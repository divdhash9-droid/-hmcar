// [[ARABIC_HEADER]] هذا الملف (middleware/adminAuth.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// middleware/adminAuth.js
const { requireAuth } = require('./auth');

const adminAuth = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ error: 'غير مصرح لك بالوصول إلى هذه الصفحة' });
  });
};

module.exports = adminAuth;
