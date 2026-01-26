// [[ARABIC_HEADER]] هذا الملف (scripts/healthCheck.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// نص اختبار الصحة
// يتحقق من صحة التطبيق في البيئتين

const http = require('http');
const https = require('https');

class HealthChecker {
  constructor() {
    this.baseUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:4000';
    this.timeout = 10000; // 10 ثواني
  }

  /**
   * اختبار شامل لصحة التطبيق
   */
  async runFullHealthCheck() {
    console.log('🏥 بدء اختبار صحة التطبيق...\n');
    
    const checks = [
      { name: 'الاتصال الأساسي', func: () => this.checkBasicConnection() },
      { name: 'واجهة الرئيسية', func: () => this.checkHomePage() },
      { name: 'واجهة تسجيل الدخول', func: () => this.checkLoginPage() },
      { name: 'واجهة السيارات', func: () => this.checkCarsPage() },
      { name: 'API الصحة', func: () => this.checkHealthApi() },
      { name: 'الموارد الثابتة', func: () => this.checkStaticAssets() }
    ];
    
    const results = [];
    
    for (const check of checks) {
      try {
        console.log(`🔍 فحص: ${check.name}`);
        const result = await check.func();
        results.push({ ...result, name: check.name });
        
        if (result.status === 'passed') {
          console.log(`✅ ${check.name}: نجح\n`);
        } else {
          console.log(`❌ ${check.name}: فشل - ${result.message}\n`);
        }
      } catch (error) {
        console.log(`❌ ${check.name}: خطأ - ${error.message}\n`);
        results.push({
          name: check.name,
          status: 'failed',
          message: error.message
        });
      }
    }
    
    return this.generateHealthReport(results);
  }

  /**
   * فحص الاتصال الأساسي
   */
  async checkBasicConnection() {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            status: 'passed',
            message: `الرمز: ${res.statusCode}`,
            statusCode: res.statusCode
          });
        } else {
          reject(new Error(`رمز الحالة: ${res.statusCode}`));
        }
      });
      
      req.setTimeout(this.timeout, () => {
        req.destroy();
        reject(new Error('انتهت مهلة الاتصال'));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * فحص واجهة الرئيسية
   */
  async checkHomePage() {
    const response = await this.fetchUrl('/');
    const hasTitle = response.body.includes('<title>') || response.body.includes('HM CAR');
    const hasContent = response.body.length > 1000;
    
    if (hasTitle && hasContent) {
      return {
        status: 'passed',
        message: 'الواجهة الرئيسية تحمّل بشكل صحيح'
      };
    } else {
      throw new Error('الواجهة الرئيسية لا تحتوي على المحتوى المتوقع');
    }
  }

  /**
   * فحص واجهة تسجيل الدخول
   */
  async checkLoginPage() {
    const response = await this.fetchUrl('/auth/login');
    const hasLoginForm = response.body.includes('form') && response.body.includes('login');
    
    if (hasLoginForm) {
      return {
        status: 'passed',
        message: 'نموذج تسجيل الدخول متاح'
      };
    } else {
      throw new Error('نموذج تسجيل الدخول غير متاح');
    }
  }

  /**
   * فحص واجهة السيارات
   */
  async checkCarsPage() {
    const response = await this.fetchUrl('/cars');
    const hasCarsContent = response.body.includes('car') || response.body.includes('سيارة');
    
    if (hasCarsContent) {
      return {
        status: 'passed',
        message: 'صفحة السيارات تحمّل بشكل صحيح'
      };
    } else {
      throw new Error('صفحة السيارات لا تحتوي على المحتوى المتوقع');
    }
  }

  /**
   * فحص API الصحة
   */
  async checkHealthApi() {
    const response = await this.fetchUrl('/health');
    
    try {
      const healthData = JSON.parse(response.body);
      if (healthData.status && ['healthy', 'degraded'].includes(healthData.status)) {
        return {
          status: 'passed',
          message: `الحالة: ${healthData.status}`,
          data: healthData
        };
      } else {
        throw new Error(`حالة API غير صحيحة: ${healthData.status}`);
      }
    } catch (error) {
      throw new Error('API الصحة لا تعيد بيانات JSON صحيحة');
    }
  }

  /**
   * فحص الموارد الثابتة
   */
  async checkStaticAssets() {
    const assets = [
      '/public/css/luxury-theme.css',
      '/public/js/home-scripts.js',
      '/public/images/logo.png'
    ];
    
    const results = await Promise.all(
      assets.map(async (asset) => {
        try {
          const response = await this.fetchUrl(asset);
          return response.statusCode === 200;
        } catch {
          return false;
        }
      })
    );
    
    const passedCount = results.filter(Boolean).length;
    
    if (passedCount === assets.length) {
      return {
        status: 'passed',
        message: 'جميع الموارد الثابتة متاحة'
      };
    } else {
      throw new Error(`بعض الموارد الثابتة غير متاحة (${passedCount}/${assets.length})`);
    }
  }

  /**
   * جلب URL مع معالجة الأخطاء
   */
  async fetchUrl(path) {
    return new Promise((resolve, reject) => {
      const fullUrl = new URL(path, this.baseUrl);
      const protocol = fullUrl.protocol === 'https:' ? https : http;
      
      const req = protocol.get(fullUrl, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      
      req.setTimeout(this.timeout, () => {
        req.destroy();
        reject(new Error('انتهت مهلة الطلب'));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * توليد تقرير الصحة
   */
  generateHealthReport(results) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total = results.length;
    
    const overallStatus = failed === 0 ? 'healthy' : failed < total * 0.5 ? 'degraded' : 'unhealthy';
    
    return {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      overallStatus,
      summary: {
        passed,
        failed,
        total
      },
      details: results
    };
  }

  /**
   * عرض تقرير الصحة بشكل جميل
   */
  displayHealthReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 تقرير صحة التطبيق');
    console.log('='.repeat(60));
    
    console.log(`\n📊 الحالة العامة: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`);
    console.log(`🌐 العنوان: ${report.baseUrl}`);
    console.log(`⏰ التاريخ: ${new Date(report.timestamp).toLocaleString('ar-SA')}`);
    
    console.log(`\n📈 الملخص:`);
    console.log(`   ✅ ناجح: ${report.summary.passed}`);
    console.log(`   ❌ فاشل: ${report.summary.failed}`);
    console.log(`   📊 المجموع: ${report.summary.total}`);
    
    console.log(`\n📋 التفاصيل:`);
    report.details.forEach(detail => {
      console.log(`   ${this.getStatusEmoji(detail.status)} ${detail.name}: ${detail.message}`);
    });
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * الحصول على رمز الحالة
   */
  getStatusEmoji(status) {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '❓';
    }
  }
}

// تنفيذ الاختبار
async function runHealthCheck() {
  const checker = new HealthChecker();
  
  try {
    const report = await checker.runFullHealthCheck();
    checker.displayHealthReport(report);
    
    // حفظ التقرير
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, '..', 'logs', 'health-check-report.json');
    const logsDir = path.dirname(reportPath);
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 تم حفظ التقرير في: ${reportPath}`);
    
    // إنهاء العملية حسب الحالة
    if (report.overallStatus === 'unhealthy') {
      console.log('\n🔴 التطبيق غير صحي. تحتاج لفحص أعمق.');
      process.exit(1);
    } else if (report.overallStatus === 'degraded') {
      console.log('\n🟡 التطبيق يعمل لكن مع مشاكل طفيفة.');
      process.exit(0);
    } else {
      console.log('\n🟢 التطبيق صحي وجاهز للاستخدام!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ خطأ في اختبار الصحة:', error.message);
    process.exit(1);
  }
}

// تنفيذ الاختبار
if (require.main === module) {
  runHealthCheck();
}

module.exports = { HealthChecker, runHealthCheck };