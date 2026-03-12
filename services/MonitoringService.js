// [[ARABIC_HEADER]] هذا الملف (services/MonitoringService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Monitoring Service
 * خدمة مراقبة أداء النظام - مُحسّنة لبيئة الإنتاج مع دعم Sentry
 */

const os = require('os');
const logger = require('./LoggerService');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0 },
      responseTime: [],
      errors: [],
      lastHealthCheck: null
    };

    // التفعيل التلقائي لـ Sentry في حال وجود المفتاح في المتغيرات البيئية
    this.initSentry();
    
    // بدء الفحوصات الدورية
    this.startHealthChecks();
  }

  /**
   * تهيئة Sentry للمراقبة الفورية للأخطاء
   */
  initSentry() {
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = require('@sentry/node');
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 1.0,
        });
        this.sentryEnabled = true;
        logger.info('✅ تم تفعيل مراقبة الأخطاء عبر Sentry');
      } catch (err) {
        logger.warn('⚠️ تعذر تشغيل Sentry (تأكد من تثبيت المكتبة):', err.message);
      }
    }
  }

  /**
   * تسجيل المقاييس لكل طلب HTTP
   */
  recordRequest(statusCode, duration) {
    this.metrics.requests.total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
    this.metrics.responseTime.push(duration);
    if (this.metrics.responseTime.length > 1000) this.metrics.responseTime.shift();
  }

  /**
   * تسجيل الخطأ وإرساله لـ Sentry إذا كان مفعلاً
   */
  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      context,
      timestamp: new Date()
    });

    if (this.metrics.errors.length > 100) this.metrics.errors.shift();

    // إرسال لـ Sentry للتبليغ الفوري
    if (this.sentryEnabled) {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, { extra: context });
    }

    logger.error('Error recorded', error, context);
  }

  /**
   * الحصول على الحالة الصحية للنظام
   */
  getHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      system: this.getSystemMetrics(),
      application: this.getApplicationMetrics(),
      database: { connected: true } 
    };

    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100
      : 0;

    if (errorRate > 10) health.status = 'unhealthy';
    else if (errorRate > 5) health.status = 'degraded';

    this.metrics.lastHealthCheck = health;
    return health;
  }

  getSystemMetrics() {
    return {
      platform: os.platform(),
      cpus: os.cpus().length,
      memory: {
        total: this.formatBytes(os.totalmem()),
        free: this.formatBytes(os.freemem()),
        usagePercent: ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)
      }
    };
  }

  getApplicationMetrics() {
    return {
      nodeVersion: process.version,
      uptime: process.uptime(),
      requests: {
        ...this.metrics.requests,
        errorRate: this.metrics.requests.total > 0
          ? ((this.metrics.requests.failed / this.metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  /**
   * Get response time statistics
   */
  getResponseTimeStats() {
    if (this.metrics.responseTime.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.metrics.responseTime].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avg: (sum / sorted.length).toFixed(2),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.metrics.errors.slice(-limit).reverse();
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  startHealthChecks() {
    setInterval(() => {
      const health = this.getHealth();
      if (health.status === 'unhealthy') {
        logger.error('🚨 تنبيه: حالة النظام غير مستقرة!', null, { health });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check database connection
   */
  async checkDatabase() {
    try {
      const mongoose = require('mongoose');
      return {
        connected: mongoose.connection.readyState === 1,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Check Redis connection
   */
  async checkRedis() {
    try {
      const cacheService = require('./CacheService');
      const testKey = 'health:check';
      await cacheService.set(testKey, 'ok', 10);
      const value = await cacheService.get(testKey);
      await cacheService.del(testKey);
      
      return {
        connected: value === 'ok',
        status: 'healthy'
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Get detailed system report
   */
  async getDetailedReport() {
    return {
      health: this.getHealth(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      recentErrors: this.getRecentErrors(20)
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0 },
      responseTime: [],
      errors: [],
      lastHealthCheck: null
    };
  }
}

// Export singleton
module.exports = new MonitoringService();
