// [[ARABIC_HEADER]] هذا الملف (middleware/validation.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[وسيط التحقق من البيانات]] - middleware/validation.js
 * 
 * هذا الوسيط يتحقق من صحة البيانات المدخلة في الطلبات
 * - التحقق من أنواع البيانات
 * - التحقق من القيم المطلوبة
 * - التحقق من التنسيقات (email, phone, etc.)
 * 
 * @author HM CAR Team
 * @version 1.0.0
 */

const logger = require('../modules/core/logger');

/**
 * دالة مساعدة للتحقق من صحة البريد الإلكتروني
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * دالة مساعدة للتحقق من صحة رقم الهاتف
 * @param {string} phone 
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * دالة مساعدة للتحقق من صحة ObjectId
 * @param {string} id 
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * إنشاء وسيط التحقق
 * @param {Object} schema - مخطط التحقق
 * @returns {Function} - وسيط Express
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const data = { ...req.body, ...req.params, ...req.query };

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // التحقق من الحقول المطلوبة
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rules.requiredMessage || `الحقل ${field} مطلوب`,
          type: 'required'
        });
        continue;
      }

      // تخطي التحقق إذا كان الحقل غير مطلوب وفارغ
      if (!value && !rules.required) {
        continue;
      }

      // التحقق من النوع
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push({
            field,
            message: `الحقل ${field} يجب أن يكون من نوع ${rules.type}`,
            type: 'type',
            expected: rules.type,
            actual: actualType
          });
        }
      }

      // التحقق من الحد الأدنى للطول
      if (rules.minLength && String(value).length < rules.minLength) {
        errors.push({
          field,
          message: `الحقل ${field} يجب أن يحتوي على ${rules.minLength} أحرف على الأقل`,
          type: 'minLength',
          minLength: rules.minLength,
          actual: String(value).length
        });
      }

      // التحقق من الحد الأقصى للطول
      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push({
          field,
          message: `الحقل ${field} يجب أن لا يتجاوز ${rules.maxLength} حرف`,
          type: 'maxLength',
          maxLength: rules.maxLength,
          actual: String(value).length
        });
      }

      // التحقق من الحد الأدنى للقيمة الرقمية
      if (rules.min !== undefined && Number(value) < rules.min) {
        errors.push({
          field,
          message: `الحقل ${field} يجب أن يكون ${rules.min} أو أكثر`,
          type: 'min',
          min: rules.min,
          actual: Number(value)
        });
      }

      // التحقق من الحد الأقصى للقيمة الرقمية
      if (rules.max !== undefined && Number(value) > rules.max) {
        errors.push({
          field,
          message: `الحقل ${field} يجب أن يكون ${rules.max} أو أقل`,
          type: 'max',
          max: rules.max,
          actual: Number(value)
        });
      }

      // التحقق من النمط (Regex)
      if (rules.pattern && !rules.pattern.test(String(value))) {
        errors.push({
          field,
          message: rules.patternMessage || `الحقل ${field} يحتوي على تنسيق غير صالح`,
          type: 'pattern'
        });
      }

      // التحقق من البريد الإلكتروني
      if (rules.email && !isValidEmail(value)) {
        errors.push({
          field,
          message: 'البريد الإلكتروني غير صالح',
          type: 'email'
        });
      }

      // التحقق من رقم الهاتف
      if (rules.phone && !isValidPhone(value)) {
        errors.push({
          field,
          message: 'رقم الهاتف غير صالح',
          type: 'phone'
        });
      }

      // التحقق من ObjectId
      if (rules.objectId && !isValidObjectId(value)) {
        errors.push({
          field,
          message: `المعرف ${field} غير صالح`,
          type: 'objectId'
        });
      }

      // التحقق من القيم المسموح بها (Enum)
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field,
          message: `القيمة ${value} غير مسموح بها. القيم المسموح بها: ${rules.enum.join(', ')}`,
          type: 'enum',
          allowed: rules.enum,
          actual: value
        });
      }

      // التحقق المخصص
      if (rules.custom && typeof rules.custom === 'function') {
        const customResult = rules.custom(value, data);
        if (customResult !== true) {
          errors.push({
            field,
            message: customResult || `الحقل ${field} غير صالح`,
            type: 'custom'
          });
        }
      }
    }

    if (errors.length > 0) {
      logger.warn('فشل التحقق من البيانات:', { errors, path: req.path });
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صالحة',
        errors
      });
    }

    next();
  };
};

/**
 * وسيط معالجة أخطاء التحقق من express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      type: 'validation'
    }));

    logger.warn('أخطاء التحقق:', { errors: formattedErrors, path: req.path });
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors: formattedErrors
    });
  }
  next();
};

// مخططات التحقق الجاهزة
const schemas = {
  // التحقق من تسجيل المستخدم
  register: {
    name: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, email: true },
    phone: { required: false, phone: true },
    password: { required: true, minLength: 6, maxLength: 100 }
  },

  // التحقق من تسجيل الدخول
  login: {
    email: { required: true, email: true },
    password: { required: true }
  },

  // التحقق من إنشاء سيارة
  createCar: {
    title: { required: true, minLength: 3, maxLength: 200 },
    make: { required: true, minLength: 2 },
    model: { required: true, minLength: 1 },
    year: { required: true, min: 1900, max: new Date().getFullYear() + 1 },
    price: { required: true, min: 0 },
    mileage: { required: false, min: 0 },
    fuelType: { required: false, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
    transmission: { required: false, enum: ['Automatic', 'Manual'] }
  },

  // التحقق من إنشاء مزاد
  createAuction: {
    carId: { required: true, objectId: true },
    startingPrice: { required: true, min: 0 },
    startsAt: { 
      required: true, 
      custom: (value) => new Date(value) > new Date() || 'تاريخ البداية يجب أن يكون في المستقبل'
    },
    endsAt: { 
      required: true,
      custom: (value, data) => {
        if (new Date(value) <= new Date(data.startsAt)) {
          return 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية';
        }
        return true;
      }
    }
  },

  // التحقق من إنشاء عرض
  createBid: {
    auctionId: { required: true, objectId: true },
    amount: { required: true, min: 0 }
  },

  // التحقق من إنشاء طلب
  createOrder: {
    items: { required: true, type: 'array' },
    'items.*.itemType': { required: true, enum: ['car', 'sparePart', 'auctionWin'] },
    'items.*.refId': { required: true, objectId: true },
    'items.*.qty': { required: true, min: 1 }
  },

  // التحقق من تحديث المستخدم
  updateUser: {
    name: { required: false, minLength: 2, maxLength: 50 },
    phone: { required: false, phone: true },
    avatar: { required: false, type: 'string' }
  }
};

// وسائط التحقق الجاهزة
const validateRegister = validate(schemas.register);
const validateLogin = validate(schemas.login);
const validateCreateCar = validate(schemas.createCar);
const validateCreateAuction = validate(schemas.createAuction);
const validateCreateBid = validate(schemas.createBid);
const validateCreateOrder = validate(schemas.createOrder);
const validateUpdateUser = validate(schemas.updateUser);

module.exports = {
  validate,
  schemas,
  validateRegister,
  validateLogin,
  validateCreateCar,
  validateCreateAuction,
  validateCreateBid,
  validateCreateOrder,
  validateUpdateUser,
  isValidEmail,
  isValidPhone,
  isValidObjectId
};
