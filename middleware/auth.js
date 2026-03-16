// [[ARABIC_HEADER]] هذا الملف (middleware/auth.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const jwt = require('jsonwebtoken');

// middleware/auth.js
const requireAuth = (req, res, next) => {
  // حارس (Guard): يمنع الوصول للصفحات المحمية إذا لم يكن المستخدم مسجل دخول
  if (!req.session.user) return res.redirect('/auth/login');
  next();
};

// For API routes - return JSON instead of redirect
const requireAuthAPI = (req, res, next) => {
  // Check for JWT in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return res.status(500).json({ error: 'Server configuration error' });
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token invalid or expired', details: err.message });
    }
  }

  // Fallback to session
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }
  req.user = req.session.user;
  next();
};

// Simple auth middleware for API routes
const auth = (req, res, next) => {
  // Check for JWT in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return res.status(500).json({ error: 'Server configuration error' });
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token invalid' });
    }
  }

  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }
  req.user = req.session.user;
  next();
};

// Permission check middleware for API routes
const requirePermissionAPI = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }

    // [[ARABIC_COMMENT]] السوبر أدمن له كافة الصلاحيات دائماً
    if (req.user.role === 'super_admin') {
      return next();
    }

    // [[ARABIC_COMMENT]] التحقق من الصلاحيات للأدمن والمدير (Manager)
    // [[ARABIC_COMMENT]] تأكد من أن الأدمن يملك الصلاحية المحددة في مصفوفة permissions
    const userPermissions = req.user.permissions || [];
    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'ليس لديك صلاحية للوصول', 
      message: `عذراً، لا تملك صلاحية (${permission}) المطلوبة لتنفيذ هذا الإجراء` 
    });
  };
};

// Middleware to require admin access
const requireAdmin = (req, res, next) => {
  // If user is not attached to req (e.g. from session), try to get it
  if (!req.user && req.session && req.session.user) {
    req.user = req.session.user;
  }

  if (!req.user) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/auth/login');
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    // For non-API routes, render error or unauthorized paged
    return res.status(403).send('Forbidden');
  }
  next();
};

module.exports = { requireAuth, requireAuthAPI, auth, requirePermissionAPI, requireAdmin };