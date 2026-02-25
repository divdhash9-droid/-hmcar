// [[ARABIC_HEADER]] هذا الملف (modules/utils/helpers.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[ملف الدوال المساعدة]] - modules/utils/helpers.js
 * 
 * هذا الملف يحتوي على جميع الدوال المساعدة العامة
 * - دوال التنسيق
 * - دوال التحقق
 * - دوال المعالجة
 * 
 * @author HM CAR Team
 */

const crypto = require('crypto');
const logger = require('../core/logger');

/**
 * فئة الدوال المساعدة
 */
class Helpers {
  /**
   * توليد معرف فريد
   */
  static generateId(length = 12) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * توليد رمز عشوائي
   */
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * تشفير النص
   */
  static encrypt(text, secret) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(secret, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('فشل في تشفير النص', error);
      throw error;
    }
  }

  /**
   * فك تشفير النص
   */
  static decrypt(encryptedText, secret) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(secret, 'salt', 32);
      
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('فشل في فك تشفير النص', error);
      throw error;
    }
  }

  /**
   * تنسيق التاريخ بالعربية
   */
  static formatDateArabic(date) {
    try {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Riyadh'
      };
      
      return new Date(date).toLocaleDateString('ar-SA', options);
    } catch (error) {
      logger.error('فشل في تنسيق التاريخ', error);
      return date.toString();
    }
  }

  /**
   * تنسيق الأرقام بالعربية
   */
  static formatNumberArabic(number) {
    try {
      return number.toLocaleString('ar-SA');
    } catch (error) {
      logger.error('فشل في تنسيق الرقم', error);
      return number.toString();
    }
  }

  /**
   * تنسيق العملة
   */
  static formatCurrency(amount, currency = 'SAR') {
    try {
      return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      logger.error('فشل في تنسيق العملة', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * التحقق من البريد الإلكتروني
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * التحقق من رقم الهاتف السعودي
   */
  static isValidSaudiPhone(phone) {
    const phoneRegex = /^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * التحقق من قوة كلمة المرور
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };

    if (password.length < 6) {
      result.isValid = false;
      result.errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    if (!/[a-zA-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('كلمة المرور يجب أن تحتوي على حروف');
    }

    if (!/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('كلمة المرور يجب أن تحتوي على أرقام');
    }

    return result;
  }

  /**
   * تنظيف وتطهير النص
   */
  static sanitizeText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // إزالة علامات HTML
      .replace(/javascript:/gi, '') // إزالة JavaScript
      .replace(/on\w+=/gi, '') // إزالة أحداث JavaScript
      .substring(0, 1000); // تحديد الطول
  }

  /**
   * إنشاء slug من النص
   */
  static createSlug(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * إنشاء اسم فريد للملف
   */
  static generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * حساب الفارق الزمني
   */
  static getTimeDifference(date1, date2) {
    const diff = Math.abs(new Date(date1) - new Date(date2));
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    if (minutes > 0) return `${minutes} دقيقة`;
    return `${seconds} ثانية`;
  }

  /**
   * تقسيم المصفوفة إلى صفحات
   */
  static paginate(array, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: array.slice(startIndex, endIndex),
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    };
  }

  /**
   * البحث في المصفوفة
   */
  static searchArray(array, searchTerm, fields = []) {
    if (!searchTerm) return array;
    
    const searchLower = searchTerm.toLowerCase();
    
    return array.filter(item => {
      if (fields.length === 0) {
        // البحث في جميع الحقول
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      } else {
        // البحث في حقول محددة
        return fields.some(field => 
          item[field] && item[field].toString().toLowerCase().includes(searchLower)
        );
      }
    });
  }

  /**
   * فرز المصفوفة
   */
  static sortArray(array, field, direction = 'asc') {
    return array.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      // التعامل مع التواريخ
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      
      // التعامل مع النصوص
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
  }

  /**
   * إنشاء استجابة API موحدة
   */
  static createApiResponse(success, data = null, message = '', error = null) {
    const response = {
      success,
      timestamp: new Date().toISOString()
    };
    
    if (success) {
      response.data = data;
      if (message) response.message = message;
    } else {
      response.error = error || message;
      if (message) response.message = message;
    }
    
    return response;
  }

  /**
   * التحقق من وجود قيمة في الكائن
   */
  static hasValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined;
    }, obj);
  }

  /**
   * الحصول على قيمة من الكائن مع مسار آمن
   */
  static safeGet(obj, path, defaultValue = null) {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : defaultValue;
      }, obj);
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * تأخير التنفيذ
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * إعادة المحاولة
   */
  static async retry(fn, maxAttempts = 3, delayMs = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        logger.warn(`المحاولة ${attempt} فشلت، إعادة المحاولة بعد ${delayMs}ms`);
        await this.delay(delayMs);
      }
    }
    
    throw lastError;
  }

  /**
   * التحقق من الصلاحية
   */
  static hasPermission(userPermissions, requiredPermission) {
    if (!userPermissions || !requiredPermission) return false;
    return userPermissions[requiredPermission] === true;
  }

  /**
   * إنشاء رمز CSRF
   */
  static generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * التحقق من رمز CSRF
   */
  static verifyCSRFToken(token, sessionToken) {
    return token && sessionToken && token === sessionToken;
  }
}

module.exports = Helpers;
