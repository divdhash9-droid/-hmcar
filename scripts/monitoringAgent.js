// [[ARABIC_HEADER]] هذا الملف (scripts/monitoringAgent.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// وكيل المراقبة التلقائي
// يراقب أداء التطبيق ويبلغ عن المشاكل تلقائياً

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class MonitoringAgent {
  constructor() {
    this.config = {
      checkInterval: 5 * 60 * 1000, // كل 5 دقائق
      healthCheckUrl: process.env.HEALTH_CHECK_URL || 'http://localhost:4000/health',
      logRetentionDays: 7,
      alertThresholds: {
        cpu: 80, // نسبة CPU %
        memory: 80, // نسبة الذاكرة %
        responseTime: 5000, // ميلي ثانية
        errorRate: 5 // نسبة الأخطاء %
      }
    };
    
    this.state = {
      lastCheck: null,
      consecutiveFailures: 0,
      alertsSent: 0,
      isRunning: false
    };
    
    this.logsDir = path.join(__dirname, '..', 'logs', 'monitoring');
    this.ensureLogsDirectory();
  }

  /**
   * بدء المراقبة
   */
  start() {
    if (this.state.isRunning) {
      console.log('⚠️ المراقبة تعمل بالفعل');
      return;
    }
    
    this.state.isRunning = true;
    console.log('🚀 بدء وكيل المراقبة...');
    
    // تنفيذ فحص فوري
    this.performCheck();
    
    // بدء الفحص الدوري
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.config.checkInterval);
  }

  /**
   * إيقاف المراقبة
   */
  stop() {
    if (!this.state.isRunning) {
      console.log('⚠️ المراقبة متوقفة بالفعل');
      return;
    }
    
    this.state.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    console.log('🛑 تم إيقاف وكيل المراقبة');
  }

  /**
   * تنفيذ فحص شامل
   */
  async performCheck() {
    try {
      console.log(`🔍 فحص المراقبة - ${new Date().toLocaleString('ar-SA')}`);
      
      const checks = await Promise.allSettled([
        this.checkHealthEndpoint(),
        this.checkSystemResources(),
        this.checkLogFileSizes(),
        this.checkDatabaseConnection()
      ]);
      
      const results = checks.map((check, index) => ({
        name: ['Health Endpoint', 'System Resources', 'Log Files', 'Database'][index],
        status: check.status,
        result: check.status === 'fulfilled' ? check.value : check.reason
      }));
      
      const checkResult = {
        timestamp: new Date().toISOString(),
        overallStatus: this.calculateOverallStatus(results),
        checks: results
      };
      
      this.logCheckResult(checkResult);
      this.handleAlerts(checkResult);
      
      this.state.lastCheck = checkResult;
      this.state.consecutiveFailures = checkResult.overallStatus === 'healthy' ? 0 : this.state.consecutiveFailures + 1;
      
    } catch (error) {
      console.error('❌ خطأ في فحص المراقبة:', error.message);
      this.state.consecutiveFailures++;
    }
  }

  /**
   * فحص نقطة نهاية الصحة
   */
  async checkHealthEndpoint() {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const https = require('https');
      
      const url = new URL(this.config.healthCheckUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const healthData = JSON.parse(data);
              resolve({
                status: 'healthy',
                statusCode: res.statusCode,
                data: healthData
              });
            } catch {
              resolve({
                status: 'degraded',
                message: 'Health endpoint returned invalid JSON'
              });
            }
          } else {
            resolve({
              status: 'unhealthy',
              statusCode: res.statusCode,
              message: `HTTP ${res.statusCode}`
            });
          }
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
      
      req.on('error', reject);
    });
  }

  /**
   * فحص موارد النظام
   */
  async checkSystemResources() {
    const os = require('os');
    
    // CPU Usage
    const cpuUsage = await this.getCpuUsage();
    
    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryPercent = (usedMem / totalMem) * 100;
    
    // Process Memory
    const processMem = process.memoryUsage();
    const processMemoryPercent = (processMem.heapUsed / totalMem) * 100;
    
    return {
      cpu: {
        percent: cpuUsage,
        threshold: this.config.alertThresholds.cpu,
        status: cpuUsage > this.config.alertThresholds.cpu ? 'warning' : 'ok'
      },
      memory: {
        percent: memoryPercent,
        processPercent: processMemoryPercent,
        threshold: this.config.alertThresholds.memory,
        status: memoryPercent > this.config.alertThresholds.memory ? 'warning' : 'ok'
      }
    };
  }

  /**
   * الحصول على استخدام CPU
   */
  getCpuUsage() {
    return new Promise((resolve) => {
      const os = require('os');
      const cpus = os.cpus();
      
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = ((total - idle) / total) * 100;
      
      resolve(Math.round(usage * 100) / 100);
    });
  }

  /**
   * فحص أحجام ملفات السجل
   */
  async checkLogFileSizes() {
    const logDir = path.join(__dirname, '..', 'logs');
    const maxSize = 50 * 1024 * 1024; // 50 MB
    
    if (!fs.existsSync(logDir)) {
      return { status: 'ok', message: 'No logs directory' };
    }
    
    const files = fs.readdirSync(logDir);
    const largeFiles = [];
    
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size > maxSize) {
        largeFiles.push({
          file,
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size)
        });
      }
    });
    
    return {
      status: largeFiles.length > 0 ? 'warning' : 'ok',
      largeFiles,
      message: largeFiles.length > 0 ? 
        `Found ${largeFiles.length} large log files` : 
        'Log files size is normal'
    };
  }

  /**
   * فحص اتصال قاعدة البيانات
   */
  async checkDatabaseConnection() {
    try {
      const mongoose = require('mongoose');
      const isConnected = mongoose.connection.readyState === 1;
      
      return {
        status: isConnected ? 'ok' : 'critical',
        connected: isConnected,
        message: isConnected ? 'Database connected' : 'Database disconnected'
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        message: 'Database connection check failed'
      };
    }
  }

  /**
   * حساب الحالة العامة
   */
  calculateOverallStatus(checkResults) {
    const criticalIssues = checkResults.filter(r => 
      r.result?.status === 'critical' || 
      (r.result?.cpu?.status === 'warning' && r.result.cpu.percent > 90) ||
      (r.result?.memory?.status === 'warning' && r.result.memory.percent > 90)
    );
    
    const warningIssues = checkResults.filter(r => 
      r.result?.status === 'warning' ||
      r.result?.cpu?.status === 'warning' ||
      r.result?.memory?.status === 'warning'
    );
    
    if (criticalIssues.length > 0) return 'critical';
    if (warningIssues.length > 0) return 'warning';
    return 'healthy';
  }

  /**
   * تسجيل نتيجة الفحص
   */
  logCheckResult(result) {
    const logFile = path.join(this.logsDir, `monitoring-${new Date().toISOString().split('T')[0]}.json`);
    
    // قراءة السجل الحالي
    let logs = [];
    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(content);
      } catch {
        logs = [];
      }
    }
    
    // إضافة النتيجة الجديدة
    logs.push(result);
    
    // الاحتفاظ بآخر 1000 سجل فقط
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    // حفظ السجل
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }

  /**
   * معالجة التنبيهات
   */
  handleAlerts(result) {
    const shouldAlert = result.overallStatus !== 'healthy';
    
    if (shouldAlert) {
      this.state.alertsSent++;
      console.log(`🚨 تنبيه #${this.state.alertsSent}: الحالة ${result.overallStatus}`);
      
      // هنا يمكن إضافة إرسال تنبيهات عبر البريد الإلكتروني أو Slack
      this.sendAlertNotification(result);
    }
  }

  /**
   * إرسال تنبيه
   */
  sendAlertNotification(result) {
    // مثال بسيط لإرسال تنبيه
    const alertMessage = `
🚨 تنبيه نظام المراقبة
الحالة: ${result.overallStatus}
الوقت: ${new Date(result.timestamp).toLocaleString('ar-SA')}

التفاصيل:
${result.checks.map(check => 
  `- ${check.name}: ${check.result?.status || 'unknown'}`
).join('\n')}
    `.trim();
    
    // حفظ التنبيه في ملف
    const alertFile = path.join(this.logsDir, 'alerts.log');
    const alertEntry = `[${new Date().toISOString()}] ${alertMessage}\n`;
    fs.appendFileSync(alertFile, alertEntry);
    
    // في الإنتاج، يمكن إضافة:
    // - إرسال بريد إلكتروني
    // - إرسال رسالة Slack
    // - إرسال تنبيه عبر SMS
  }

  /**
   * التأكد من وجود مجلد السجلات
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * تنسيق البايتات
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * الحصول على إحصائيات المراقبة
   */
  getStats() {
    return {
      isRunning: this.state.isRunning,
      lastCheck: this.state.lastCheck,
      consecutiveFailures: this.state.consecutiveFailures,
      alertsSent: this.state.alertsSent,
      config: this.config
    };
  }
}

// تشغيل المراقبة تلقائياً إذا تم تشغيل الملف مباشرة
if (require.main === module) {
  const agent = new MonitoringAgent();
  
  // بدء المراقبة
  agent.start();
  
  // إيقاف المراقبة عند إنهاء العملية
  process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف وكيل المراقبة...');
    agent.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    agent.stop();
    process.exit(0);
  });
}

module.exports = MonitoringAgent;