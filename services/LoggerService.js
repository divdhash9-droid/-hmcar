// [[ARABIC_HEADER]] هذا الملف (services/LoggerService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Advanced Logging Service
 * نظام تسجيل متقدم باستخدام Winston
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد logs إذا لم يكن موجوداً
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// تنسيق مخصص للوقت
const customTimestamp = () => {
  return new Date().toLocaleString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// تنسيق مخصص للـ logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: customTimestamp }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format للتطوير
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// إنشاء Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'car-auction' },
  transports: [
    // Error logs - يتم حفظها بشكل منفصل
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),

    // Combined logs - جميع المستويات
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),

    // HTTP logs - طلبات HTTP فقط
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true
    }),

    // Database logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'database-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '7d'
    }),

    // Audit logs - للعمليات الحساسة
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '90d' // يحتفظ بها لفترة أطول
    })
  ]
});

// إضافة Console transport في بيئة التطوير
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Wrapper functions مع context إضافي
class LoggerService {
  constructor() {
    this.logger = logger;
  }

  /**
   * Log info level
   */
  info(message, meta = {}) {
    this.logger.info(message, this._enrichMeta(meta));
  }

  /**
   * Log warning level
   */
  warn(message, meta = {}) {
    this.logger.warn(message, this._enrichMeta(meta));
  }

  /**
   * Log error level
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...this._enrichMeta(meta),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        }
      })
    };

    this.logger.error(message, errorMeta);
  }

  /**
   * Log debug level
   */
  debug(message, meta = {}) {
    this.logger.debug(message, this._enrichMeta(meta));
  }

  /**
   * Log HTTP requests
   */
  http(message, meta = {}) {
    this.logger.log('http', message, this._enrichMeta(meta));
  }

  /**
   * Log database operations
   */
  database(operation, meta = {}) {
    this.logger.info(`DB: ${operation}`, {
      ...this._enrichMeta(meta),
      category: 'database'
    });
  }

  /**
   * Log audit events (sensitive operations)
   */
  audit(action, userId, meta = {}) {
    this.logger.info(`AUDIT: ${action}`, {
      ...this._enrichMeta(meta),
      userId,
      category: 'audit',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  security(event, meta = {}) {
    this.logger.warn(`SECURITY: ${event}`, {
      ...this._enrichMeta(meta),
      category: 'security'
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric, value, meta = {}) {
    this.logger.info(`PERFORMANCE: ${metric}`, {
      ...this._enrichMeta(meta),
      value,
      category: 'performance'
    });
  }

  /**
   * Log with custom level
   */
  log(level, message, meta = {}) {
    this.logger.log(level, message, this._enrichMeta(meta));
  }

  /**
   * Enrich metadata with additional context
   */
  _enrichMeta(meta) {
    return {
      ...meta,
      env: process.env.NODE_ENV || 'development',
      pid: process.pid,
      memory: process.memoryUsage().heapUsed
    };
  }

  /**
   * Create child logger with persistent metadata
   */
  child(metadata) {
    return this.logger.child(metadata);
  }

  /**
   * Stream for Morgan HTTP logger
   */
  get stream() {
    return {
      write: (message) => {
        this.http(message.trim());
      }
    };
  }
}

// Export singleton instance
module.exports = new LoggerService();
