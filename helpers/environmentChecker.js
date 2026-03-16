// [[ARABIC_HEADER]] هذا الملف (helpers/environmentChecker.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// فاحص البيئة
// يتحقق من صحة الإعدادات ويبلغ عن المشاكل المحتملة

const mongoose = require('mongoose');
const serverConfig = require('../config/serverConfig');

class EnvironmentChecker {
  constructor() {
    this.results = {
      database: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' },
      environment: { status: 'unknown', message: '' },
      security: { status: 'unknown', message: '' },
      performance: { status: 'unknown', message: '' }
    };
  }

  /**
   * فحص شامل لجميع مكونات البيئة
   */
  async checkAll() {
    console.log('🔍 بدء فحص البيئة...');
    
    await this.checkDatabase();
    await this.checkRedis();
    await this.checkEnvironmentVariables();
    await this.checkSecuritySettings();
    await this.checkPerformanceSettings();
    
    return this.generateReport();
  }

  /**
   * فحص قاعدة البيانات
   */
  async checkDatabase() {
    try {
      console.log('🔍 فحص قاعدة البيانات...');
      
      // محاولة الاتصال أولاً
      const { connectDB } = require('../config/database.js');
      await connectDB();
      
      if (mongoose.connection.readyState === 1) {
        this.results.database = {
          status: 'ok',
          message: 'الاتصال بقاعدة البيانات ناجح'
        };
        console.log('✅ قاعدة البيانات متصلة');
      } else {
        this.results.database = {
          status: 'error',
          message: 'لا يوجد اتصال بقاعدة البيانات'
        };
        console.log('❌ قاعدة البيانات غير متصلة');
      }
    } catch (error) {
      this.results.database = {
        status: 'error',
        message: `خطأ في قاعدة البيانات: ${error.message}`
      };
      console.log(`❌ خطأ في قاعدة البيانات: ${error.message}`);
    }
  }

  /**
   * فحص Redis
   */
  async checkRedis() {
    try {
      console.log('🔍 فحص Redis...');
      
      const cacheService = require('../services/CacheService');
      if (cacheService.isRedisEnabled) {
        // اختبار بسيط
        const testKey = 'env_check:test';
        await cacheService.set(testKey, 'test_value', 10);
        const result = await cacheService.get(testKey);
        await cacheService.del(testKey);
        
        if (result === 'test_value') {
          this.results.redis = {
            status: 'ok',
            message: 'Redis يعمل بشكل صحيح'
          };
          console.log('✅ Redis يعمل');
        } else {
          this.results.redis = {
            status: 'warning',
            message: 'Redis متصل لكن هناك مشاكل في القراءة/الكتابة'
          };
          console.log('⚠️ Redis متصل لكن هناك مشاكل');
        }
      } else {
        this.results.redis = {
          status: 'warning',
          message: 'Redis غير مفعل أو غير متوفر'
        };
        console.log('⚠️ Redis غير مفعل');
      }
    } catch (error) {
      this.results.redis = {
        status: 'error',
        message: `خطأ في Redis: ${error.message}`
      };
      console.log(`❌ خطأ في Redis: ${error.message}`);
    }
  }

  /**
   * فحص متغيرات البيئة
   */
  checkEnvironmentVariables() {
    console.log('🔍 فحص متغيرات البيئة الحساسة...');
    
    const requiredVars = [
      'NODE_ENV',
      'MONGO_URI',
      'SESSION_SECRET',
      'JWT_SECRET',
      'BASE_URL'
    ];
    
    // متغيرات الإنتاج الإلزامية
    const prodRequiredVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'ALLOWED_ORIGINS'
    ];
    
    const missingVars = [];
    const warnings = [];
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
    
    // فحص إضافي للإنتاج
    if (serverConfig.isProduction || serverConfig.isVercel) {
      prodRequiredVars.forEach(v => {
        if (!process.env[v]) missingVars.push(v);
      });

      if (!process.env.MONGO_URI?.includes('mongodb.net')) {
        warnings.push('يُفضل استخدام MongoDB Atlas في الإنتاج');
      }
      
      if (process.env.SESSION_SECRET === 'hm_car_auction_luxury_secret_2024') {
        warnings.push('يجب تغيير SESSION_SECRET في الإنتاج (خطر أمني)');
      }

      if (process.env.JWT_SECRET === 'hm_car_jwt_secret_primary_2024') {
        warnings.push('يجب تغيير JWT_SECRET في الإنتاج (خطر أمني)');
      }
    }
    
    if (missingVars.length === 0 && warnings.length === 0) {
      this.results.environment = {
        status: 'ok',
        message: 'جميع متغيرات البيئة المطلوبة متوفرة وصحيحة'
      };
      console.log('✅ متغيرات البيئة صحيحة');
    } else if (missingVars.length > 0) {
      this.results.environment = {
        status: 'error',
        message: `متغيرات إلزامية مفقودة: ${missingVars.join(', ')}`
      };
      console.log(`❌ متغيرات مفقودة: ${missingVars.join(', ')}`);
    } else {
      this.results.environment = {
        status: 'warning',
        message: `تحذيرات أمنية: ${warnings.join(', ')}`
      };
      console.log(`⚠️ تحذيرات: ${warnings.join(', ')}`);
    }
  }

  /**
   * فحص إعدادات الأمان
   */
  checkSecuritySettings() {
    console.log('🔍 فحص إعدادات الأمان...');
    
    const issues = [];
    
    // فحص Helmet
    try {
      require('helmet');
      console.log('✅ Helmet مثبت');
    } catch (error) {
      issues.push('Helmet غير مثبت');
    }
    
    // فحص CSRF
    try {
      require('csurf');
      console.log('✅ CSURF مثبت');
    } catch (error) {
      issues.push('CSURF غير مثبت');
    }
    
    // فحص Rate Limiting
    if (serverConfig.security.rateLimit.skip && !serverConfig.isDevelopment) {
      issues.push('حد الطلبات معطل في الإنتاج');
    }
    
    if (issues.length === 0) {
      this.results.security = {
        status: 'ok',
        message: 'إعدادات الأمان مكتملة'
      };
      console.log('✅ إعدادات الأمان مكتملة');
    } else {
      this.results.security = {
        status: 'warning',
        message: `مشاكل أمان: ${issues.join(', ')}`
      };
      console.log(`⚠️ مشاكل أمان: ${issues.join(', ')}`);
    }
  }

  /**
   * فحص إعدادات الأداء
   */
  checkPerformanceSettings() {
    console.log('🔍 فحص إعدادات الأداء...');
    
    const issues = [];
    const recommendations = [];
    
    // فحص التخزين المؤقت
    if (!serverConfig.cache.immutable && serverConfig.isProduction) {
      recommendations.push('تفعيل immutable caching في الإنتاج');
    }
    
    // فحص Compression
    try {
      require('compression');
      console.log('✅ Compression مثبت');
    } catch (error) {
      recommendations.push('تثبيت compression لتحسين الأداء');
    }
    
    // فحص Cluster Mode
    if (serverConfig.isProduction && require('os').cpus().length > 1) {
      const cluster = require('cluster');
      if (cluster.isMaster || cluster.isPrimary) {
        recommendations.push('استخدام Cluster Mode لتحسين الأداء');
      }
    }
    
    this.results.performance = {
      status: recommendations.length > 0 ? 'warning' : 'ok',
      message: recommendations.length > 0 ? 
        `توصيات الأداء: ${recommendations.join(', ')}` : 
        'إعدادات الأداء ممتازة'
    };
    
    if (recommendations.length > 0) {
      console.log(`⚠️ توصيات الأداء: ${recommendations.join(', ')}`);
    } else {
      console.log('✅ إعدادات الأداء ممتازة');
    }
  }

  /**
   * توليد تقرير الفحص
   */
  generateReport() {
    const overallStatus = this.calculateOverallStatus();
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: serverConfig.getEnvironmentInfo(),
      overallStatus,
      checks: this.results,
      summary: this.generateSummary()
    };
    
    return report;
  }

  /**
   * حساب الحالة العامة
   */
  calculateOverallStatus() {
    const statuses = Object.values(this.results).map(check => check.status);
    
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    return 'ok';
  }

  /**
   * توليد الملخص
   */
  generateSummary() {
    const okCount = Object.values(this.results).filter(r => r.status === 'ok').length;
    const warningCount = Object.values(this.results).filter(r => r.status === 'warning').length;
    const errorCount = Object.values(this.results).filter(r => r.status === 'error').length;
    
    return {
      passed: okCount,
      warnings: warningCount,
      errors: errorCount,
      total: Object.keys(this.results).length
    };
  }

  /**
   * عرض التقرير بشكل جميل
   */
  displayReport(report) {
    console.log('\n' + '='.repeat(50));
    console.log('📋 تقرير فحص البيئة');
    console.log('='.repeat(50));
    
    console.log(`\n📊 الحالة العامة: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`);
    
    Object.entries(report.checks).forEach(([checkName, result]) => {
      console.log(`\n${this.getStatusEmoji(result.status)} ${checkName}:`);
      console.log(`   ${result.message}`);
    });
    
    console.log(`\n📈 الملخص:`);
    console.log(`   ✅ ناجح: ${report.summary.passed}`);
    console.log(`   ⚠️  تحذيرات: ${report.summary.warnings}`);
    console.log(`   ❌ أخطاء: ${report.summary.errors}`);
    console.log(`   📊 المجموع: ${report.summary.total}`);
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * الحصول على رمز الحالة
   */
  getStatusEmoji(status) {
    switch (status) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }
}

// تصدير نسخة واحدة
module.exports = new EnvironmentChecker();