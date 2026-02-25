// [[ARABIC_HEADER]] هذا الملف (modules/core/logger.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[ملف تسجيل الأحداث]] - modules/core/logger.js
 * 
 * هذا الملف مسؤول عن تسجيل الأحداث والسجلات
 * - تسجيل الأخطاء
 * - تسجيل المعلومات
 * - تسجيل العمليات
 * 
 * @author HM CAR Team
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * فئة لإدارة السجلات
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', '..', 'logs');
    this.fileLoggingEnabled = false;
    // Only enable file logging in non-serverless environments
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
      this.ensureLogDirectory();
    }
  }

  /**
   * التأكد من وجود مجلد السجلات
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      this.fileLoggingEnabled = true;
    } catch (error) {
      // Filesystem is read-only (Vercel serverless), use console only
      this.fileLoggingEnabled = false;
    }
  }

  /**
   * الحصول على التاريخ الحالي
   */
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * الحصول على الوقت الحالي
   */
  getCurrentTime() {
    return new Date().toLocaleTimeString('ar-SA');
  }

  /**
   * كتابة السجل في الملف
   */
  writeToFile(level, message, data = null) {
    if (!this.fileLoggingEnabled) return; // Skip file logging in serverless
    const logFile = path.join(this.logDir, `app-${this.getCurrentDate()}.log`);
    const timestamp = `${this.getCurrentDate()} ${this.getCurrentTime()}`;

    let logEntry = `[${timestamp}] [${level}] ${message}`;

    if (data) {
      logEntry += `\n${JSON.stringify(data, null, 2)}`;
    }

    logEntry += '\n';

    try {
      fs.appendFileSync(logFile, logEntry, 'utf8');
    } catch (error) {
      // silently ignore file write errors
    }
  }


  /**
   * تسجيل معلومات
   */
  info(message, data = null) {
    const logMessage = `ℹ️ ${message}`;
    console.log(logMessage);
    this.writeToFile('INFO', message, data);
  }

  /**
   * تسجيل خطأ
   */
  error(message, error = null) {
    const logMessage = `❌ ${message}`;
    console.error(logMessage);

    let errorData = null;
    if (error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    this.writeToFile('ERROR', message, errorData);
  }

  /**
   * تسجيل تحذير
   */
  warn(message, data = null) {
    const logMessage = `⚠️ ${message}`;
    console.warn(logMessage);
    this.writeToFile('WARN', message, data);
  }

  /**
   * تسجيل نجاح
   */
  success(message, data = null) {
    const logMessage = `✅ ${message}`;
    console.log(logMessage);
    this.writeToFile('SUCCESS', message, data);
  }

  /**
   * تسجيل عملية دخول
   */
  login(userId, userType, ip, deviceInfo = null) {
    const message = `تسجيل دخول: ${userType} - ${userId}`;
    const data = {
      userId,
      userType,
      ip,
      deviceInfo,
      timestamp: new Date().toISOString()
    };

    this.info(message, data);
  }

  /**
   * تسجيل عملية خروج
   */
  logout(userId, userType, ip) {
    const message = `تسجيل خروج: ${userType} - ${userId}`;
    const data = {
      userId,
      userType,
      ip,
      timestamp: new Date().toISOString()
    };

    this.info(message, data);
  }

  /**
   * تسجيل عملية API
   */
  api(method, endpoint, userId = null, statusCode = 200) {
    const message = `API: ${method} ${endpoint} - ${statusCode}`;
    const data = {
      method,
      endpoint,
      userId,
      statusCode,
      timestamp: new Date().toISOString()
    };

    this.info(message, data);
  }

  /**
   * تسجيل عملية قاعدة البيانات
   */
  database(operation, collection, result = null) {
    const message = `DB: ${operation} - ${collection}`;
    const data = {
      operation,
      collection,
      result: result ? 'success' : 'failed',
      timestamp: new Date().toISOString()
    };

    this.info(message, data);
  }

  /**
   * تسجيل عملية أمان
   */
  security(event, userId = null, ip = null, details = null) {
    const message = `SECURITY: ${event}`;
    const data = {
      event,
      userId,
      ip,
      details,
      timestamp: new Date().toISOString()
    };

    this.warn(message, data);
  }

  /**
   * تنظيف السجلات القديمة
   */
  cleanup(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`تم حذف ملف السجل القديم: ${file}`);
        }
      });
    } catch (error) {
      this.error('فشل في تنظيف السجلات القديمة', error);
    }
  }
}

// إنشاء نسخة واحدة من مسجل السجلات
const logger = new Logger();

module.exports = logger;
