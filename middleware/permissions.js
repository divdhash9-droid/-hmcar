const User = require('../models/User');
const Settings = require('../models/Settings');

// دالة التحقق من الصلاحيات
const checkPermission = (user, permission) => {
  if (!user) return false;
  
  // Super Admin لديه كل الصلاحيات
  if (user.role === 'super_admin') return true;
  
  // التحقق من الصلاحية المحددة
  return user.permissions && user.permissions.includes(permission);
};

// Middleware للتحقق من الصلاحيات
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }
    
    if (!checkPermission(req.session.user, permission)) {
      return res.status(403).render('error', {
        layout: 'admin',
        error: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
        user: req.session.user
      });
    }
    
    next();
  };
};

// Middleware للتحقق من الدور
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        layout: 'admin',
        error: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
        user: req.session.user
      });
    }
    
    next();
  };
};

// دالة الحصول على الصلاحيات الافتراضية حسب الدور
const getDefaultPermissions = (role) => {
  const permissions = {
    super_admin: [
      'manage_users', 'manage_settings', 'manage_footer', 'manage_whatsapp',
      'manage_cars', 'manage_parts', 'manage_auctions', 'view_analytics', 'manage_content'
    ],
    admin: [
      'manage_cars', 'manage_parts', 'manage_auctions', 'view_analytics', 'manage_content'
    ],
    manager: [
      'manage_cars', 'manage_parts', 'view_analytics'
    ],
    buyer: [],
    seller: []
  };
  
  return permissions[role] || [];
};

module.exports = {
  checkPermission,
  requirePermission,
  requireRole,
  getDefaultPermissions
};
