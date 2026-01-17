// [[ARABIC_HEADER]] هذا الملف (utils/validators.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * utils/validators.js
 * وحدة التحقق من صحة البيانات
 * 
 * الوصف:
 * - توفر دوال تحقق شاملة لجميع أنواع البيانات
 * - تدعم التحقق من المدخلات العربية والإنجليزية
 * - تحمي من هجمات الحقن والـ XSS
 */

const validator = require('validator');

/**
 * تنظيف النص من الأكواد الضارة
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * تنظيف كائن كامل
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * التحقق من البريد الإلكتروني
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email.trim().toLowerCase());
};

/**
 * التحقق من رقم الهاتف (صيغ متعددة)
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // أرقام سعودية
  const saudiPatterns = [
    /^05\d{8}$/,           // 05xxxxxxxx
    /^5\d{8}$/,            // 5xxxxxxxx
    /^\+9665\d{8}$/,       // +9665xxxxxxxx
    /^009665\d{8}$/        // 009665xxxxxxxx
  ];
  
  // أرقام دولية عامة
  const internationalPattern = /^\+?\d{10,15}$/;
  
  return saudiPatterns.some(p => p.test(cleaned)) || internationalPattern.test(cleaned);
};

/**
 * التحقق من كلمة المرور (قوية)
 */
const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return { valid: false, errors: ['كلمة المرور مطلوبة'] };
  
  const errors = [];
  
  if (password.length < 8) errors.push('يجب أن تكون 8 أحرف على الأقل');
  if (password.length > 128) errors.push('يجب ألا تتجاوز 128 حرف');
  if (!/[a-z]/.test(password)) errors.push('يجب أن تحتوي على حرف صغير');
  if (!/[A-Z]/.test(password)) errors.push('يجب أن تحتوي على حرف كبير');
  if (!/\d/.test(password)) errors.push('يجب أن تحتوي على رقم');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('يجب أن تحتوي على رمز خاص');
  
  // التحقق من كلمات المرور الشائعة
  const commonPasswords = ['password', '123456', 'qwerty', 'admin123', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('كلمة المرور شائعة جداً');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * حساب قوة كلمة المرور
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (/[^\w\s]/.test(password)) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  if (score <= 6) return 'good';
  return 'strong';
};

/**
 * التحقق من الاسم (عربي/إنجليزي)
 */
const isValidName = (name, options = {}) => {
  const { minLength = 2, maxLength = 100, allowNumbers = false, requireTwoWords = false } = options;
  
  if (!name || typeof name !== 'string') return { valid: false, error: 'الاسم مطلوب' };
  
  const trimmed = name.trim();
  
  if (trimmed.length < minLength) return { valid: false, error: `الاسم قصير جداً (الحد الأدنى ${minLength} أحرف)` };
  if (trimmed.length > maxLength) return { valid: false, error: `الاسم طويل جداً (الحد الأقصى ${maxLength} حرف)` };
  
  // السماح بالعربية والإنجليزية والمسافات
  const pattern = allowNumbers 
    ? /^[\u0600-\u06FFa-zA-Z0-9\s\-']+$/
    : /^[\u0600-\u06FFa-zA-Z\s\-']+$/;
  
  if (!pattern.test(trimmed)) {
    return { valid: false, error: 'الاسم يحتوي على أحرف غير مسموحة' };
  }
  
  if (requireTwoWords) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      return { valid: false, error: 'يجب أن يتكون الاسم من اسمين على الأقل' };
    }
  }
  
  return { valid: true };
};

/**
 * التحقق من MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

/**
 * التحقق من URL
 */
const isValidUrl = (url, options = {}) => {
  const { protocols = ['http', 'https'], requireTld = true } = options;
  
  if (!url || typeof url !== 'string') return false;
  
  return validator.isURL(url.trim(), {
    protocols,
    require_tld: requireTld,
    require_protocol: true
  });
};

/**
 * التحقق من السعر
 */
const isValidPrice = (price, options = {}) => {
  const { min = 0, max = 100000000, allowZero = false } = options;
  
  const num = parseFloat(price);
  
  if (isNaN(num)) return { valid: false, error: 'السعر غير صالح' };
  if (num < min) return { valid: false, error: `السعر أقل من الحد الأدنى (${min})` };
  if (num > max) return { valid: false, error: `السعر أعلى من الحد الأقصى (${max})` };
  if (!allowZero && num === 0) return { valid: false, error: 'السعر لا يمكن أن يكون صفر' };
  
  return { valid: true, value: num };
};

/**
 * التحقق من السنة
 */
const isValidYear = (year, options = {}) => {
  const currentYear = new Date().getFullYear();
  const { min = 1900, max = currentYear + 2 } = options;
  
  const num = parseInt(year, 10);
  
  if (isNaN(num)) return { valid: false, error: 'السنة غير صالحة' };
  if (num < min) return { valid: false, error: `السنة أقدم من الحد الأدنى (${min})` };
  if (num > max) return { valid: false, error: `السنة أحدث من الحد الأقصى (${max})` };
  
  return { valid: true, value: num };
};

/**
 * التحقق من الأرقام الموجبة
 */
const isPositiveNumber = (value, options = {}) => {
  const { min = 0, max = Infinity, integer = false } = options;
  
  const num = integer ? parseInt(value, 10) : parseFloat(value);
  
  if (isNaN(num)) return { valid: false, error: 'القيمة غير صالحة' };
  if (num < min) return { valid: false, error: `القيمة أقل من الحد الأدنى (${min})` };
  if (num > max) return { valid: false, error: `القيمة أعلى من الحد الأقصى (${max})` };
  
  return { valid: true, value: num };
};

/**
 * التحقق من التاريخ
 */
const isValidDate = (date, options = {}) => {
  const { minDate, maxDate, allowPast = true, allowFuture = true } = options;
  
  const parsed = new Date(date);
  
  if (isNaN(parsed.getTime())) return { valid: false, error: 'التاريخ غير صالح' };
  
  const now = new Date();
  
  if (!allowPast && parsed < now) return { valid: false, error: 'لا يمكن اختيار تاريخ في الماضي' };
  if (!allowFuture && parsed > now) return { valid: false, error: 'لا يمكن اختيار تاريخ في المستقبل' };
  if (minDate && parsed < new Date(minDate)) return { valid: false, error: 'التاريخ أقدم من المسموح' };
  if (maxDate && parsed > new Date(maxDate)) return { valid: false, error: 'التاريخ أحدث من المسموح' };
  
  return { valid: true, value: parsed };
};

/**
 * التحقق من قيمة ضمن قائمة محددة
 */
const isInEnum = (value, allowedValues, options = {}) => {
  const { caseSensitive = false } = options;
  
  if (!value) return { valid: false, error: 'القيمة مطلوبة' };
  
  const compareValue = caseSensitive ? value : String(value).toLowerCase();
  const compareList = caseSensitive ? allowedValues : allowedValues.map(v => String(v).toLowerCase());
  
  if (!compareList.includes(compareValue)) {
    return { valid: false, error: `القيمة غير مسموحة. القيم المتاحة: ${allowedValues.join(', ')}` };
  }
  
  return { valid: true };
};

/**
 * التحقق من صورة (mime type)
 */
const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return allowedTypes.includes(mimetype);
};

/**
 * التحقق من حجم الملف
 */
const isValidFileSize = (size, maxSizeMB = 5) => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
};

/**
 * التحقق من مبلغ المزايدة
 */
const isValidBidAmount = (amount, currentPrice, minimumIncrement = 100) => {
  const num = parseFloat(amount);
  
  if (isNaN(num)) return { valid: false, error: 'مبلغ المزايدة غير صالح' };
  if (num <= currentPrice) return { valid: false, error: 'يجب أن يكون مبلغ المزايدة أعلى من السعر الحالي' };
  if (num < currentPrice + minimumIncrement) {
    return { valid: false, error: `الحد الأدنى للزيادة هو ${minimumIncrement}` };
  }
  
  return { valid: true, value: num };
};

/**
 * إنشاء middleware للتحقق
 */
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field] || req.query[field] || req.params[field];
      
      for (const rule of rules) {
        const result = rule.validator(value, rule.options);
        
        if (result === false || (typeof result === 'object' && !result.valid)) {
          errors.push({
            field,
            message: rule.message || (typeof result === 'object' ? result.error : `${field} غير صالح`)
          });
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'خطأ في البيانات المدخلة',
        details: errors
      });
    }
    
    // تنظيف البيانات
    req.body = sanitizeObject(req.body);
    next();
  };
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  calculatePasswordStrength,
  isValidName,
  isValidObjectId,
  isValidUrl,
  isValidPrice,
  isValidYear,
  isPositiveNumber,
  isValidDate,
  isInEnum,
  isValidImageType,
  isValidFileSize,
  isValidBidAmount,
  createValidationMiddleware
};
