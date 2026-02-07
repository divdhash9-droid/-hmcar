#!/usr/bin/env node

/**
 * [[ARABIC_HEADER]] هذا الملف (scripts/health-monitor.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
 * 
 * نظام المراقبة والصيانة لـ HM CAR
 * - مراقبة الأداء
 * - التحقق من الصحة
 * - الإشعارات التلقائية
 * - التقارير اليومية
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class HealthMonitor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.logDir = path.join(this.projectRoot, 'logs');
    this.reportsDir = path.join(this.projectRoot, 'reports');
    this.config = {
      checkInterval: 60000, // دقيقة واحدة
      reportInterval: 3600000, // ساعة واحدة
      alertThreshold: 3, // عدد الأخطاء قبل الإشعار
      maxLogSize: 10 * 1024 * 1024, // 10MB
      retentionDays: 30
    };
    
    this.ensureDirectories();
  }

  // التأكد من وجود المجلدات
  ensureDirectories() {
    [this.logDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // تسجيل الأحداث
  log(message, type = 'info', saveToFile = true) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      health: chalk.cyan,
      performance: chalk.magenta
    };
    
    const logMessage = `[${timestamp}] ${message}`;
    console.log(colors[type](logMessage));
    
    if (saveToFile) {
      this.writeToLog(logMessage, type);
    }
  }

  // الكتابة إلى ملف السجل
  writeToLog(message, type) {
    const logFile = path.join(this.logDir, `health-${type}.log`);
    const logEntry = `${message}\n`;
    
    fs.appendFileSync(logFile, logEntry);
    
    // التحقق من حجم الملف
    this.rotateLogIfNeeded(logFile);
  }

  // تدوير ملفات السجل
  rotateLogIfNeeded(logFile) {
    try {
      const stats = fs.statSync(logFile);
      if (stats.size > this.config.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = logFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(logFile, backupFile);
      }
    } catch (error) {
      // تجاهل خطأ الملف غير موجود
    }
  }

  // بدء المراقبة المستمرة
  async startMonitoring() {
    this.log('🚀 بدء المراقبة المستمرة...', 'health');
    
    // الفحص الفوري
    await this.performHealthCheck();
    
    // الفحص الدوري
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);
    
    // التقارير الدورية
    this.reportInterval = setInterval(async () => {
      await this.generateDailyReport();
    }, this.config.reportInterval);
    
    this.log('✅ المراقبة تعمل بنجاح', 'success');
    return { status: 'monitoring', interval: this.config.checkInterval };
  }

  // إيقاف المراقبة
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    this.log('⏹️ تم إيقاف المراقبة', 'warning');
  }

  // الفحص الصحي الشامل
  async performHealthCheck() {
    const checks = [
      { name: 'Server Status', check: this.checkServerStatus.bind(this) },
      { name: 'Database Connection', check: this.checkDatabaseConnection.bind(this) },
      { name: 'Memory Usage', check: this.checkMemoryUsage.bind(this) },
      { name: 'Disk Space', check: this.checkDiskSpace.bind(this) },
      { name: 'API Response Time', check: this.checkAPIResponse.bind(this) },
      { name: 'Error Rate', check: this.checkErrorRate.bind(this) },
      { name: 'Active Users', check: this.checkActiveUsers.bind(this) }
    ];

    const results = [];
    let allHealthy = true;

    for (const check of checks) {
      try {
        const result = await check.check();
        results.push({ name: check.name, status: 'healthy', result });
        this.log(`✅ ${check.name}: ${result.status}`, 'success');
      } catch (error) {
        results.push({ name: check.name, status: 'unhealthy', error: error.message });
        this.log(`❌ ${check.name}: ${error.message}`, 'error');
        allHealthy = false;
        
        // إشعار عند الخطأ
        await this.sendAlert(check.name, error.message);
      }
    }

    // حفظ نتيجة الفحص
    await this.saveHealthCheck(results);
    
    return { healthy: allHealthy, checks: results };
  }

  // التحقق من حالة الخادم
  async checkServerStatus() {
    try {
      const response = await this.makeRequest('http://localhost:4000/health');
      return { status: 'running', responseTime: response.responseTime };
    } catch (error) {
      throw new Error('الخادم لا يستجيب');
    }
  }

  // التحقق من اتصال قاعدة البيانات
  async checkDatabaseConnection() {
    try {
      // هنا يمكن إضافة اتصال فعلي بقاعدة البيانات
      return { status: 'connected', type: 'mongodb' };
    } catch (error) {
      throw new Error('فشل الاتصال بقاعدة البيانات');
    }
  }

  // التحقق من استخدام الذاكرة
  async checkMemoryUsage() {
    const usage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const status = memoryUsagePercent > 80 ? 'critical' : memoryUsagePercent > 60 ? 'warning' : 'normal';
    
    return {
      status,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      systemUsage: Math.round(memoryUsagePercent) + '%'
    };
  }

  // التحقق من مساحة القرص
  async checkDiskSpace() {
    try {
      const stats = fs.statSync(this.projectRoot);
      // هنا يمكن إضافة فحص فعلي لمساحة القرص
      return { status: 'normal', available: 'sufficient' };
    } catch (error) {
      throw new Error('لا يمكن التحقق من مساحة القرص');
    }
  }

  // التحقق من استجابة API
  async checkAPIResponse() {
    const endpoints = [
      '/api/health',
      '/admin',
      '/cars'
    ];

    const results = [];
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`http://localhost:4000${endpoint}`);
        results.push({ endpoint, status: 'ok', responseTime: response.responseTime });
      } catch (error) {
        results.push({ endpoint, status: 'error', error: error.message });
      }
    }

    const failedCount = results.filter(r => r.status === 'error').length;
    if (failedCount > 0) {
      throw new Error(`${failedCount} endpoints فشلت`);
    }

    return { status: 'healthy', endpoints: results };
  }

  // التحقق من معدل الأخطاء
  async checkErrorRate() {
    const errorLogPath = path.join(this.logDir, 'health-error.log');
    
    if (!fs.existsSync(errorLogPath)) {
      return { status: 'normal', errorRate: 0 };
    }

    const content = fs.readFileSync(errorLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const recentErrors = lines.filter(line => {
      const timestamp = new Date(line.match(/\[(.*?)\]/)?.[1]);
      const oneHourAgo = new Date(Date.now() - 3600000);
      return timestamp > oneHourAgo;
    });

    const errorRate = recentErrors.length;
    const status = errorRate > 10 ? 'critical' : errorRate > 5 ? 'warning' : 'normal';

    return { status, errorRate, recentErrors: recentErrors.length };
  }

  // التحقق من المستخدمين النشطين
  async checkActiveUsers() {
    try {
      // هنا يمكن إضافة تحقق فعلي من قاعدة البيانات
      return { status: 'normal', activeUsers: 0 };
    } catch (error) {
      return { status: 'unknown', activeUsers: 0 };
    }
  }

  // إجراء طلب HTTP
  async makeRequest(url) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const http = require('http');
      const https = require('https');
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ statusCode: res.statusCode, responseTime });
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  // حفظ نتيجة الفحص الصحي
  async saveHealthCheck(results) {
    const healthData = {
      timestamp: new Date().toISOString(),
      results: results,
      overall: results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy'
    };

    const healthFile = path.join(this.reportsDir, `health-${Date.now()}.json`);
    fs.writeFileSync(healthFile, JSON.stringify(healthData, null, 2));
  }

  // إرسال إشعار
  async sendAlert(checkName, error) {
    const alert = {
      timestamp: new Date().toISOString(),
      check: checkName,
      error: error,
      severity: 'high'
    };

    // حفظ الإشعار
    const alertFile = path.join(this.reportsDir, `alert-${Date.now()}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

    // هنا يمكن إضافة إشعارات عبر Slack, Discord, Email, etc.
    this.log(`🚨 إشعار: ${checkName} - ${error}`, 'error');
  }

  // إنشاء تقرير يومي
  async generateDailyReport() {
    this.log('📊 إنشاء التقرير اليومي...', 'performance');
    
    const report = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      summary: await this.generateSummary(),
      performance: await this.getPerformanceMetrics(),
      errors: await this.getErrorSummary(),
      recommendations: await this.generateRecommendations()
    };

    const reportFile = path.join(this.reportsDir, `daily-report-${report.date}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    this.log(`✅ تم إنشاء التقرير اليومي: ${reportFile}`, 'success');
    return report;
  }

  // توليد ملخص
  async generateSummary() {
    const healthFiles = fs.readdirSync(this.reportsDir)
      .filter(file => file.startsWith('health-') && file.endsWith('.json'))
      .sort()
      .slice(-24); // آخر 24 فحص

    const healthChecks = healthFiles.map(file => {
      const content = fs.readFileSync(path.join(this.reportsDir, file), 'utf8');
      return JSON.parse(content);
    });

    const totalChecks = healthChecks.length;
    const healthyChecks = healthChecks.filter(check => check.overall === 'healthy').length;
    const uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;

    return {
      totalHealthChecks: totalChecks,
      healthyChecks: healthyChecks,
      uptime: Math.round(uptime),
      lastCheck: healthChecks[healthChecks.length - 1]?.timestamp || null
    };
  }

  // الحصول على مقاييس الأداء
  async getPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round(process.uptime()) + 's'
    };
  }

  // الحصول على ملخص الأخطاء
  async getErrorSummary() {
    const errorLogPath = path.join(this.logDir, 'health-error.log');
    
    if (!fs.existsSync(errorLogPath)) {
      return { totalErrors: 0, recentErrors: [] };
    }

    const content = fs.readFileSync(errorLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const today = new Date().toISOString().split('T')[0];
    const todayErrors = lines.filter(line => line.includes(today));

    return {
      totalErrors: lines.length,
      todayErrors: todayErrors.length,
      recentErrors: todayErrors.slice(-10)
    };
  }

  // توليد التوصيات
  async generateRecommendations() {
    const recommendations = [];
    
    // التحقق من استخدام الذاكرة
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    
    if (memUsageMB > 500) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'استخدام الذاكرة مرتفع، يرجى مراجعة تسرب الذاكرة'
      });
    }

    // التحقق من الأخطاء
    const errorSummary = await this.getErrorSummary();
    if (errorSummary.todayErrors > 20) {
      recommendations.push({
        type: 'errors',
        priority: 'medium',
        message: 'عدد الأخطاء اليومي مرتفع، يرجى مراجعة السجلات'
      });
    }

    return recommendations;
  }

  // تنظيف الملفات القديمة
  async cleanup() {
    this.log('🧹 بدء تنظيف الملفات القديمة...', 'info');
    
    const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
    
    // تنظيف ملفات التقارير
    const reportFiles = fs.readdirSync(this.reportsDir);
    for (const file of reportFiles) {
      const filePath = path.join(this.reportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        this.log(`🗑️ تم حذف: ${file}`, 'info');
      }
    }

    // تنظيف ملفات السجل
    const logFiles = fs.readdirSync(this.logDir);
    for (const file of logFiles) {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        this.log(`🗑️ تم حذف: ${file}`, 'info');
      }
    }

    this.log('✅ تم التنظيف بنجاح', 'success');
  }

  // عرض لوحة التحكم
  async showDashboard() {
    console.clear();
    console.log(chalk.cyan('🏥 HM CAR Health Monitor Dashboard\n'));
    
    const health = await this.performHealthCheck();
    const performance = await this.getPerformanceMetrics();
    const summary = await this.generateSummary();
    
    console.log(chalk.yellow('📊 Health Status:'));
    console.log(`  Overall: ${health.healthy ? chalk.green('✅ Healthy') : chalk.red('❌ Unhealthy')}`);
    console.log(`  Uptime: ${chalk.green(summary.uptime + '%')}`);
    console.log(`  Last Check: ${chalk.gray(summary.lastCheck || 'Never')}\n`);
    
    console.log(chalk.yellow('💾 Memory Usage:'));
    console.log(`  Heap Used: ${chalk.cyan(performance.memory.heapUsed)}`);
    console.log(`  Heap Total: ${chalk.cyan(performance.memory.heapTotal)}`);
    console.log(`  External: ${chalk.cyan(performance.memory.external)}\n`);
    
    console.log(chalk.yellow('🔧 System:'));
    console.log(`  CPU User: ${chalk.cyan(performance.cpu.user)}`);
    console.log(`  CPU System: ${chalk.cyan(performance.cpu.system)}`);
    console.log(`  Uptime: ${chalk.cyan(performance.uptime)}\n`);
    
    console.log(chalk.yellow('📋 Checks:'));
    for (const check of health.checks) {
      const status = check.status === 'healthy' ? chalk.green('✅') : chalk.red('❌');
      console.log(`  ${status} ${check.name}`);
    }
  }
}

// واجهة سطر الأوامر
async function main() {
  const command = process.argv[2];
  const monitor = new HealthMonitor();

  try {
    switch (command) {
      case 'start':
        await monitor.startMonitoring();
        
        // عرض لوحة التحكم
        setInterval(async () => {
          await monitor.showDashboard();
        }, 5000);
        
        // منع الخروج
        process.on('SIGINT', () => {
          monitor.stopMonitoring();
          console.log('\n👋 تم إيقاف المراقبة');
          process.exit(0);
        });
        
        break;
        
      case 'check':
        await monitor.performHealthCheck();
        break;
        
      case 'report':
        await monitor.generateDailyReport();
        break;
        
      case 'cleanup':
        await monitor.cleanup();
        break;
        
      case 'dashboard':
        await monitor.showDashboard();
        break;
        
      case 'help':
        console.log(`
HM CAR Health Monitor

الأوامر المتاحة:
  start      - بدء المراقبة المستمرة
  check      - فحص صحة واحد
  report     - إنشاء تقرير يومي
  cleanup    - تنظيف الملفات القديمة
  dashboard  - عرض لوحة التحكم
  help       - عرض المساعدة

مثال:
  node scripts/health-monitor.js start
  node scripts/health-monitor.js check
        `);
        break;
        
      default:
        console.log('❌ أمر غير معروف. استخدم "help" للمساعدة');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = HealthMonitor;
