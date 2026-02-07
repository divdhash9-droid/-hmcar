// [[ARABIC_HEADER]] هذا الملف (middleware/roles.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// middleware/roles.js
module.exports.requireRole = (...roles) => (req, res, next) => {
  // حارس صلاحيات: يسمح فقط لأدوار محددة (مع استثناء admin دائماً)
  const user = req.session.user;
  if (!user) return res.status(401).send('Unauthorized');
  // دعم تمرير الأدوار كمصفوفة واحدة: requireRole(['admin','super_admin'])
  const normalizedRoles = (roles.length === 1 && Array.isArray(roles[0])) ? roles[0] : roles;
  // إذا لم يكن الدور ضمن القائمة المطلوبة (وليس admin) نرجع Forbidden
  if (!normalizedRoles.includes(user.role) && user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  next();
};