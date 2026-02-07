// [[ARABIC_HEADER]] هذا الملف (middleware/permissions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { requireAuth } = require('./auth');
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
      // إدارة المستخدمين
      'manage_users', 'view_users', 'edit_users', 'delete_users',
      // إدارة السيارات
      'manage_cars', 'view_cars', 'edit_cars', 'delete_cars', 'approve_cars',
      // إدارة قطع الغيار
      'manage_parts', 'view_parts', 'edit_parts', 'delete_parts',
      // إدارة المزادات
      'manage_auctions', 'view_auctions', 'edit_auctions', 'delete_auctions', 'end_auctions',
      // إدارة الطلبات
      'manage_orders', 'view_orders', 'edit_orders', 'delete_orders', 'approve_orders',
      // إدارة المدفوعات
      'manage_payments', 'view_payments', 'process_payments', 'refund_payments',
      // التحليلات والتقارير
      'view_analytics', 'view_reports', 'export_reports', 'manage_reports',
      // إدارة المحتوى
      'manage_content', 'edit_content', 'publish_content', 'delete_content',
      // إعدادات النظام
      'manage_settings', 'manage_footer', 'manage_whatsapp', 'manage_social',
      // الإشعارات
      'manage_notifications', 'send_notifications', 'view_notifications',
      // الدعم والرسائل
      'manage_support', 'view_support', 'reply_support',
      // النسخ الاحتياطي
      'manage_backups', 'create_backups', 'restore_backups',
      // الصلاحيات المتقدمة
      'manage_roles', 'manage_permissions', 'view_logs', 'manage_api'
    ],
    admin: [
      // إدارة السيارات
      'manage_cars', 'view_cars', 'edit_cars', 'delete_cars', 'approve_cars',
      // إدارة قطع الغيار
      'manage_parts', 'view_parts', 'edit_parts', 'delete_parts',
      // إدارة المزادات
      'manage_auctions', 'view_auctions', 'edit_auctions', 'end_auctions',
      // إدارة الطلبات
      'manage_orders', 'view_orders', 'edit_orders', 'approve_orders',
      // التحليلات والتقارير
      'view_analytics', 'view_reports', 'export_reports',
      // إدارة المحتوى
      'manage_content', 'edit_content', 'publish_content',
      // الإشعارات
      'view_notifications', 'send_notifications',
      // الدعم
      'view_support', 'reply_support'
    ],
    manager: [
      // عرض السيارات وقطع الغيار
      'view_cars', 'edit_cars',
      'view_parts', 'edit_parts',
      // عرض المزادات
      'view_auctions',
      // عرض الطلبات
      'view_orders',
      // التحليلات
      'view_analytics', 'view_reports'
    ],
    buyer: [],
    seller: []
  };
  
  return permissions[role] || [];
};

// دالة للحصول على جميع الصلاحيات المتاحة
const getAllPermissions = () => {
  return [
    // إدارة المستخدمين
    'manage_users', 'view_users', 'edit_users', 'delete_users',
    // إدارة السيارات
    'manage_cars', 'view_cars', 'edit_cars', 'delete_cars', 'approve_cars',
    // إدارة قطع الغيار
    'manage_parts', 'view_parts', 'edit_parts', 'delete_parts',
    // إدارة المزادات
    'manage_auctions', 'view_auctions', 'edit_auctions', 'delete_auctions', 'end_auctions',
    // إدارة الطلبات
    'manage_orders', 'view_orders', 'edit_orders', 'delete_orders', 'approve_orders',
    // إدارة المدفوعات
    'manage_payments', 'view_payments', 'process_payments', 'refund_payments',
    // التحليلات والتقارير
    'view_analytics', 'view_reports', 'export_reports', 'manage_reports',
    // إدارة المحتوى
    'manage_content', 'edit_content', 'publish_content', 'delete_content',
    // إعدادات النظام
    'manage_settings', 'manage_footer', 'manage_whatsapp', 'manage_social',
    // الإشعارات
    'manage_notifications', 'send_notifications', 'view_notifications',
    // الدعم والرسائل
    'manage_support', 'view_support', 'reply_support',
    // النسخ الاحتياطي
    'manage_backups', 'create_backups', 'restore_backups',
    // الصلاحيات المتقدمة
    'manage_roles', 'manage_permissions', 'view_logs', 'manage_api'
  ];
};

module.exports = {
  checkPermission,
  requirePermission,
  requireRole,
  getDefaultPermissions,
  getAllPermissions
};
