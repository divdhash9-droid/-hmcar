/**
 * Monitoring Service
 * خدمة مراقبة أداء النظام
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

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Record request metrics
   */
  recordRequest(statusCode, duration) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }

    this.metrics.responseTime.push(duration);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    logger.error('Error recorded', error, context);
  }

  /**
   * Get system health status
   */
  getHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      system: this.getSystemMetrics(),
      application: this.getApplicationMetrics(),
      database: { connected: true }, // يمكن إضافة فحص حقيقي
      redis: { connected: true } // يمكن إضافة فحص حقيقي
    };

    // Determine overall health status
    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100
      : 0;

    if (errorRate > 10) {
      health.status = 'unhealthy';
    } else if (errorRate > 5) {
      health.status = 'degraded';
    }

    this.metrics.lastHealthCheck = health;
    return health;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: this.formatBytes(totalMem),
        used: this.formatBytes(usedMem),
        free: this.formatBytes(freeMem),
        usagePercent: ((usedMem / totalMem) * 100).toFixed(2)
      },
      loadAverage: os.loadavg()
    };
  }

  /**
   * Get application metrics
   */
  getApplicationMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external)
      },
      requests: {
        ...this.metrics.requests,
        errorRate: this.metrics.requests.total > 0
          ? ((this.metrics.requests.failed / this.metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%'
      },
      responseTime: this.getResponseTimeStats()
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

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    // Check every 5 minutes
    setInterval(() => {
      const health = this.getHealth();
      
      logger.info('Health check completed', {
        status: health.status,
        memory: health.application.memory,
        requests: health.application.requests
      });

      // Alert if unhealthy
      if (health.status === 'unhealthy') {
        logger.error('System health is unhealthy!', null, {
          health
        });
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
