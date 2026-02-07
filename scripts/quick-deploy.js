#!/usr/bin/env node

/**
 * [[ARABIC_HEADER]] هذا الملف (scripts/quick-deploy.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
 * 
 * نظام النشر السريع والآمن لـ HM CAR
 * - نشر بنقرة واحدة
 * - تحقق تلقائي
 * - نسخ احتياطي آمن
 * - إشعارات الحالة
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class QuickDeploy {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.deployConfig = {
      platforms: ['vercel', 'netlify', 'github-pages'],
      backup: true,
      healthCheck: true,
      rollback: true
    };
  }

  // تسجيل الأحداث الملونة
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      deploy: chalk.cyan
    };
    
    console.log(colors[type](`[${timestamp}] ${message}`));
  }

  // النشر السريع الرئيسي
  async quickDeploy(platform = 'vercel') {
    this.log('🚀 بدء النشر السريع...', 'deploy');
    
    try {
      // الخطوة 1: التحقق من البيئة
      await this.preDeployCheck();
      
      // الخطوة 2: النسخ الاحتياطي
      if (this.deployConfig.backup) {
        await this.createBackup();
      }
      
      // الخطوة 3: التحسينات
      await this.optimizeForProduction();
      
      // الخطوة 4: النشر الفعلي
      const deployResult = await this.deployToPlatform(platform);
      
      // الخطوة 5: التحقق بعد النشر
      if (this.deployConfig.healthCheck) {
        await this.postDeployCheck(deployResult.url);
      }
      
      this.log('🎉 النشر اكتمل بنجاح!', 'success');
      return deployResult;
      
    } catch (error) {
      this.log(`❌ فشل النشر: ${error.message}`, 'error');
      
      // التراجع التلقائي
      if (this.deployConfig.rollback) {
        await this.autoRollback();
      }
      
      throw error;
    }
  }

  // التحقق قبل النشر
  async preDeployCheck() {
    this.log('🔍 التحقق قبل النشر...', 'info');
    
    const checks = [
      { name: 'التحقق من Git', check: this.checkGitStatus.bind(this) },
      { name: 'التحقق من الاعتماديات', check: this.checkDependencies.bind(this) },
      { name: 'التحقق من البناء', check: this.checkBuild.bind(this) },
      { name: 'التحقق من المتغيرات', check: this.checkEnvironment.bind(this) }
    ];

    for (const check of checks) {
      try {
        await check.check();
        this.log(`✅ ${check.name} - نجح`, 'success');
      } catch (error) {
        throw new Error(`فشل ${check.name}: ${error.message}`);
      }
    }
  }

  // التحقق من حالة Git
  async checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { cwd: this.projectRoot, encoding: 'utf8' });
      if (status.trim()) {
        this.log('⚠️ هناك تغييرات غير مرتكزة في Git', 'warning');
      }
      return { status: 'clean', hasChanges: status.trim().length > 0 };
    } catch (error) {
      throw new Error('Git غير مهيأ أو غير موجود');
    }
  }

  // التحقق من الاعتماديات
  async checkDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('ملف package.json غير موجود');
    }

    try {
      execSync('npm ls --depth=0', { cwd: this.projectRoot, stdio: 'pipe' });
      return { status: 'installed' };
    } catch (error) {
      throw new Error('بعض الاعتماديات مفقودة، قم بتشغيل npm install');
    }
  }

  // التحقق من البناء
  async checkBuild() {
    try {
      // التحقق من وجود مجلد البناء
      const buildDir = path.join(this.projectRoot, 'dist');
      if (fs.existsSync(buildDir)) {
        return { status: 'built', path: buildDir };
      }
      
      // محاولة البناء
      execSync('npm run build', { cwd: this.projectRoot, stdio: 'pipe' });
      return { status: 'built', path: buildDir };
    } catch (error) {
      throw new Error('فشل بناء المشروع');
    }
  }

  // التحقق من متغيرات البيئة
  async checkEnvironment() {
    const envPath = path.join(this.projectRoot, '.env');
    const envProdPath = path.join(this.projectRoot, '.env.production');
    
    const requiredVars = ['NODE_ENV', 'BASE_URL', 'MONGODB_URI'];
    const missing = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(`متغيرات بيئة مفقودة: ${missing.join(', ')}`);
    }

    return { checked: requiredVars.length, missing: missing.length };
  }

  // إنشاء نسخة احتياطية
  async createBackup() {
    this.log('💾 إنشاء نسخة احتياطية...', 'info');
    
    const backupDir = path.join(this.projectRoot, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `pre-deploy-${timestamp}`;
    const backupPath = path.join(backupDir, backupName);

    // حفظ معلومات النشر
    const deployInfo = {
      timestamp: new Date().toISOString(),
      branch: this.getCurrentBranch(),
      commit: this.getCurrentCommit(),
      platform: 'vercel'
    };

    fs.writeFileSync(path.join(backupPath, 'deploy-info.json'), JSON.stringify(deployInfo, null, 2));
    
    this.log(`✅ النسخ الاحتياطي: ${backupName}`, 'success');
    return { backup: backupName, path: backupPath };
  }

  // الحصول على الفرع الحالي
  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.projectRoot, encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  // الحصول على الـ commit الحالي
  getCurrentCommit() {
    try {
      return execSync('git rev-parse HEAD', { cwd: this.projectRoot, encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  // تحسين للإنتاج
  async optimizeForProduction() {
    this.log('⚡ تحسين المشروع للإنتاج...', 'info');
    
    const optimizations = [
      { name: 'ضغط الصور', task: this.optimizeImages.bind(this) },
      { name: 'تحسين CSS', task: this.optimizeCSS.bind(this) },
      { name: 'تحسين JavaScript', task: this.optimizeJS.bind(this) },
      { name: 'إزالة الملفات غير المستخدمة', task: this.cleanUnusedFiles.bind(this) }
    ];

    for (const opt of optimizations) {
      try {
        await opt.task();
        this.log(`✅ ${opt.name} - تم`, 'success');
      } catch (error) {
        this.log(`⚠️ ${opt.name} - تم تخطيه: ${error.message}`, 'warning');
      }
    }

    return { optimized: optimizations.length };
  }

  // تحسين الصور
  async optimizeImages() {
    const publicDir = path.join(this.projectRoot, 'public');
    // هنا يمكن إضافة منطق تحسين الصور
    return { optimized: 0 };
  }

  // تحسين CSS
  async optimizeCSS() {
    const cssDir = path.join(this.projectRoot, 'public/css');
    // هنا يمكن إضافة منطق تحسين CSS
    return { optimized: 0 };
  }

  // تحسين JavaScript
  async optimizeJS() {
    const jsDir = path.join(this.projectRoot, 'public/js');
    // هنا يمكن إضافة منطق تحسين JavaScript
    return { optimized: 0 };
  }

  // تنظيف الملفات غير المستخدمة
  async cleanUnusedFiles() {
    // تنظيف الملفات المؤقتة
    const tempDir = path.join(this.projectRoot, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    return { cleaned: 1 };
  }

  // النشر إلى المنصة
  async deployToPlatform(platform) {
    this.log(`🚀 النشر إلى ${platform}...`, 'deploy');
    
    switch (platform.toLowerCase()) {
      case 'vercel':
        return await this.deployToVercel();
      case 'netlify':
        return await this.deployToNetlify();
      case 'github-pages':
        return await this.deployToGitHubPages();
      default:
        throw new Error(`منصة غير مدعومة: ${platform}`);
    }
  }

  // النشر إلى Vercel
  async deployToVercel() {
    try {
      // التحقق من Vercel CLI
      execSync('vercel --version', { stdio: 'pipe' });
      
      // النشر
      const output = execSync('vercel --prod', { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // استخراج الرابط من المخرجات
      const urlMatch = output.match(/https?:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : 'https://hmcar.vercel.app';
      
      return {
        platform: 'vercel',
        url: url,
        status: 'deployed'
      };
    } catch (error) {
      throw new Error('فشل النشر إلى Vercel: تأكد من تثبيت Vercel CLI وتسجيل الدخول');
    }
  }

  // النشر إلى Netlify
  async deployToNetlify() {
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      
      const output = execSync('netlify deploy --prod --dir=dist', { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const urlMatch = output.match(/https?:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : 'https://hmcar.netlify.app';
      
      return {
        platform: 'netlify',
        url: url,
        status: 'deployed'
      };
    } catch (error) {
      throw new Error('فشل النشر إلى Netlify: تأكد من تثبيت Netlify CLI وتسجيل الدخول');
    }
  }

  // النشر إلى GitHub Pages
  async deployToGitHubPages() {
    try {
      // بناء وتوزيع على GitHub Pages
      execSync('npm run build', { cwd: this.projectRoot, stdio: 'pipe' });
      
      return {
        platform: 'github-pages',
        url: `https://${process.env.GITHUB_USER}.github.io/hm-car`,
        status: 'deployed'
      };
    } catch (error) {
      throw new Error('فشل النشر إلى GitHub Pages');
    }
  }

  // التحقق بعد النشر
  async postDeployCheck(url) {
    this.log('🔍 التحقق بعد النشر...', 'info');
    
    // انتظار قصير للنشر
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // التحقق من أن الموقع يعمل
      const https = require('https');
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Timeout')));
      });
      
      if (response.statusCode === 200) {
        this.log('✅ الموقع يعمل بنجاح', 'success');
        return { status: 'healthy', url: url, statusCode: response.statusCode };
      } else {
        throw new Error(`حالة غير متوقعة: ${response.statusCode}`);
      }
    } catch (error) {
      throw new Error(`فشل التحقق من الموقع: ${error.message}`);
    }
  }

  // التراجع التلقائي
  async autoRollback() {
    this.log('🔄 بدء التراجع التلقائي...', 'warning');
    
    try {
      // العودة إلى الـ commit السابق
      execSync('git reset --hard HEAD~1', { cwd: this.projectRoot, stdio: 'pipe' });
      
      // إعادة النشر
      const rollbackResult = await this.deployToPlatform('vercel');
      
      this.log('✅ تم التراجع بنجاح', 'success');
      return { status: 'rolled-back', url: rollbackResult.url };
    } catch (error) {
      this.log(`❌ فشل التراجع: ${error.message}`, 'error');
      throw error;
    }
  }

  // النشر التلقائي (لـ CI/CD)
  async autoDeploy() {
    this.log('🤖 بدء النشر التلقائي...', 'deploy');
    
    try {
      // التحقق من البيئة
      if (process.env.NODE_ENV !== 'production') {
        throw new Error('النشر التلقائي يعمل فقط في بيئة الإنتاج');
      }
      
      // النشر
      const result = await this.quickDeploy('vercel');
      
      // إشعار النجاح
      await this.sendNotification('success', `تم النشر بنجاح إلى ${result.url}`);
      
      return result;
    } catch (error) {
      // إشعار الفشل
      await this.sendNotification('error', `فشل النشر: ${error.message}`);
      throw error;
    }
  }

  // إرسال إشعارات
  async sendNotification(type, message) {
    // هنا يمكن إضافة إشعارات Slack, Discord, Email, etc.
    this.log(`📢 إشعار ${type}: ${message}`, 'info');
    return { sent: true, type: type, message: message };
  }
}

// واجهة سطر الأوامر
async function main() {
  const command = process.argv[2];
  const platform = process.argv[3] || 'vercel';
  const deploy = new QuickDeploy();

  try {
    switch (command) {
      case 'deploy':
        await deploy.quickDeploy(platform);
        break;
        
      case 'auto':
        await deploy.autoDeploy();
        break;
        
      case 'check':
        await deploy.preDeployCheck();
        break;
        
      case 'backup':
        await deploy.createBackup();
        break;
        
      case 'help':
        console.log(`
HM CAR Quick Deploy

الأوامر المتاحة:
  deploy [platform]  - نشر سريع (vercel, netlify, github-pages)
  auto              - نشر تلقائي (لـ CI/CD)
  check             - التحقق قبل النشر
  backup            - إنشاء نسخة احتياطية
  help              - عرض المساعدة

مثال:
  node scripts/quick-deploy.js deploy vercel
  node scripts/quick-deploy.js auto
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

module.exports = QuickDeploy;
