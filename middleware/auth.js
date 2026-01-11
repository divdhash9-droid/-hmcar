// middleware/auth.js
const requireAuth = (req, res, next) => {
  // حارس (Guard): يمنع الوصول للصفحات المحمية إذا لم يكن المستخدم مسجل دخول
  if (!req.session.user) return res.redirect('/auth/login');
  next();
};

// For API routes - return JSON instead of redirect
const requireAuthAPI = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }
  req.user = req.session.user; // Make user available in API routes
  next();
};

// Simple auth middleware for API routes
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }
  req.user = req.session.user;
  next();
};

module.exports = { requireAuth, requireAuthAPI, auth };