// [[ARABIC_HEADER]] هذا الملف (middleware/jwt.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const jwt = require('jsonwebtoken');

/**
 * إنشاء JWT Token للمستخدم
 */
function generateToken(user) {
  const payload = {
    id: user._id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: user.permissions || []
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

/**
 * التحقق من JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware للتحقق من JWT في الطلبات
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'غير مصرح - يجب تقديم Token' 
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token غير صالح أو منتهي الصلاحية' 
    });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware للتحقق من الصلاحيات
 */
function requireJWTPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'غير مصرح' 
      });
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: 'ليس لديك صلاحية للقيام بهذا الإجراء' 
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateJWT,
  requireJWTPermission
};
