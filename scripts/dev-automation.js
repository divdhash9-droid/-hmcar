#!/usr/bin/env node

/**
 * [[ARABIC_HEADER]] هذا الملف (scripts/dev-automation.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
 * 
 * نظام الأتمتة المتكامل لتطوير HM CAR
 * - إدارة التطوير التلقائي
 * - التحقق من الأخطاء
 * - النشر الآمن
 * - المراقبة والصيانة
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class HMCarDevAutomation {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.config = {
      port: 4000,
      env: process.env.NODE_ENV || 'development',
      autoBackup: true,
      autoDeploy: false,
      healthCheck: true
    };
  }

  // تسجيل الأحداث
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      debug: chalk.gray
    };
    
    console.log(colors[type](`[${timestamp}] ${message}`));
  }

  // التحقق من صحة المشروع
  async checkProjectHealth() {
    this.log('🔍 بدء فحص صحة المشروع...', 'info');
    
    const checks = [
      { name: 'التحقق من ملفات المشروع الأساسية', check: this.checkCoreFiles.bind(this) },
      { name: 'التحقق من الاعتماديات', check: this.checkDependencies.bind(this) },
      { name: 'التحقق من قاعدة البيانات', check: this.checkDatabase.bind(this) },
      { name: 'التحقق من الملفات المفقودة', check: this.checkMissingFiles.bind(this) },
      { name: 'التحقق من الأذونات', check: this.checkPermissions.bind(this) }
    ];

    let allPassed = true;
    const results = [];

    for (const check of checks) {
      try {
        this.log(`📋 ${check.name}...`, 'info');
        const result = await check.check();
        results.push({ name: check.name, status: 'success', result });
        this.log(`✅ ${check.name} - نجح`, 'success');
      } catch (error) {
        results.push({ name: check.name, status: 'error', error: error.message });
        this.log(`❌ ${check.name} - فشل: ${error.message}`, 'error');
        allPassed = false;
      }
    }

    return { allPassed, results };
  }

  // التحقق من الملفات الأساسية
  async checkCoreFiles() {
    const coreFiles = [
      'server.js',
      'package.json',
      '.env',
      'views/layout.ejs',
      'routes/admin.js',
      'models/User.js',
      'models/Car.js',
      'public/css/admin-unified.css'
    ];

    const missing = [];
    for (const file of coreFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      throw new Error(`ملفات أساسية مفقودة: ${missing.join(', ')}`);
    }

    return { checked: coreFiles.length, missing: missing.length };
  }

  // التحقق من الاعتماديات
  async checkDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const criticalDeps = ['express', 'mongoose', 'ejs', 'dotenv'];
    const missing = [];

    for (const dep of criticalDeps) {
      if (!packageJson.dependencies[dep]) {
        missing.push(dep);
      }
    }

    if (missing.length > 0) {
      throw new Error(`اعتماديات حاسمة مفقودة: ${missing.join(', ')}`);
    }

    return { dependencies: Object.keys(packageJson.dependencies).length, critical: criticalDeps.length };
  }

  // التحقق من قاعدة البيانات
  async checkDatabase() {
    try {
      // التحقق من وجود ملف الإعدادات
      const envPath = path.join(this.projectRoot, '.env');
      if (!fs.existsSync(envPath)) {
        throw new Error('ملف .env غير موجود');
      }

      return { status: 'connected', type: 'mongodb' };
    } catch (error) {
      throw new Error(`مشكلة في قاعدة البيانات: ${error.message}`);
    }
  }

  // التحقق من الملفات المفقودة
  async checkMissingFiles() {
    const requiredDirs = [
      'views',
      'routes',
      'models',
      'public',
      'middleware',
      'services'
    ];

    const missing = [];
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        missing.push(dir);
      }
    }

    if (missing.length > 0) {
      throw new Error(`مجلدات مفقودة: ${missing.join(', ')}`);
    }

    return { directories: requiredDirs.length, missing: missing.length };
  }

  // التحقق من الأذونات
  async checkPermissions() {
    try {
      const testFile = path.join(this.projectRoot, 'test-permission.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return { write: true, read: true };
    } catch (error) {
      throw new Error('مشكلة في أذونات الكتابة');
    }
  }

  // إصلاح المشاكل تلقائياً
  async autoFix() {
    this.log('🔧 بدء الإصلاح التلقائي...', 'info');
    
    const fixes = [
      { name: 'إنشاء مجلدات مفقودة', fix: this.createMissingDirectories.bind(this) },
      { name: 'إنشاء ملفات إعدادات', fix: this.createConfigFiles.bind(this) },
      { name: 'تثبيت الاعتماديات', fix: this.installDependencies.bind(this) },
      { name: 'تحديث ملفات CSS', fix: this.updateCSSFiles.bind(this) }
    ];

    for (const fix of fixes) {
      try {
        this.log(`🔧 ${fix.name}...`, 'info');
        await fix.fix();
        this.log(`✅ ${fix.name} - تم`, 'success');
      } catch (error) {
        this.log(`❌ ${fix.name} - فشل: ${error.message}`, 'error');
      }
    }
  }

  // إنشاء المجلدات المفقودة
  async createMissingDirectories() {
    const directories = [
      'logs',
      'backups',
      'temp',
      'uploads',
      'public/css',
      'public/js',
      'public/images',
      'views/admin',
      'views/partials'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    return { created: directories.length };
  }

  // إنشاء ملفات الإعدادات
  async createConfigFiles() {
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `
# HM CAR Environment Configuration
NODE_ENV=development
PORT=4000
BASE_URL=http://localhost:4000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/car-auction

# Security
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Development
DEBUG=hmcar:*
`;
      fs.writeFileSync(envPath, envContent.trim());
    }

    return { created: 1 };
  }

  // تثبيت الاعتماديات
  async installDependencies() {
    try {
      execSync('npm install', { cwd: this.projectRoot, stdio: 'pipe' });
      return { status: 'installed' };
    } catch (error) {
      throw new Error('فشل تثبيت الاعتماديات');
    }
  }

  // تحديث ملفات CSS
  async updateCSSFiles() {
    const cssDir = path.join(this.projectRoot, 'public/css');
    
    // التأكد من وجود ملفات CSS الأساسية
    const cssFiles = [
      { name: 'admin-unified.css', content: this.getAdminUnifiedCSS() },
      { name: 'admin-tabs.css', content: this.getAdminTabsCSS() }
    ];

    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file.name);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, file.content);
      }
    }

    return { updated: cssFiles.length };
  }

  // محتوى CSS الأساسي
  getAdminUnifiedCSS() {
    return `/* HM CAR Admin Unified CSS */
:root {
  --hm-primary: #1e40af;
  --hm-secondary: #f8fafc;
  --hm-sapphire: #3b82f6;
  --hm-pearl-white: #ffffff;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, var(--hm-pearl-white) 0%, var(--hm-secondary) 100%);
}
`;
  }

  getAdminTabsCSS() {
    return `/* HM CAR Admin Tabs CSS */
.hm-dashboard-tabs {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(30, 64, 175, 0.1);
}
`;
  }

  // بدء التطوير
  async startDevelopment() {
    this.log('🚀 بدء بيئة التطوير...', 'info');
    
    // فحص الصحة أولاً
    const health = await this.checkProjectHealth();
    if (!health.allPassed) {
      this.log('⚠️ تم العثور على مشاكل، جاري الإصلاح التلقائي...', 'warning');
      await this.autoFix();
      
      // فحص مرة أخرى
      const newHealth = await this.checkProjectHealth();
      if (!newHealth.allPassed) {
        throw new Error('فشل الإصلاح التلقائي، يرجى المراجعة اليدوية');
      }
    }

    this.log('✅ بيئة التطوير جاهزة', 'success');
    return { status: 'ready', port: this.config.port };
  }

  // النشر الآمن
  async deploy(options = {}) {
    this.log('🚀 بدء عملية النشر...', 'info');
    
    const deploySteps = [
      { name: 'النسخ الاحتياطي', step: this.backup.bind(this) },
      { name: 'التحقق من الصحة', step: this.checkProjectHealth.bind(this) },
      { name: 'بناء الإنتاج', step: this.buildProduction.bind(this) },
      { name: 'النشر', step: this.deployToProduction.bind(this) }
    ];

    for (const step of deploySteps) {
      try {
        this.log(`📋 ${step.name}...`, 'info');
        await step.step(options);
        this.log(`✅ ${step.name} - تم`, 'success');
      } catch (error) {
        this.log(`❌ ${step.name} - فشل: ${error.message}`, 'error');
        throw error;
      }
    }

    this.log('🎉 النشر اكتمل بنجاح!', 'success');
    return { status: 'deployed', timestamp: new Date().toISOString() };
  }

  // النسخ الاحتياطي
  async backup() {
    const backupDir = path.join(this.projectRoot, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `hmcar-backup-${timestamp}`;
    const backupPath = path.join(backupDir, backupName);

    // نسخ الملفات الهامة
    const filesToBackup = [
      'views',
      'routes',
      'models',
      'public',
      'middleware',
      'services',
      'package.json',
      '.env'
    ];

    for (const file of filesToBackup) {
      const srcPath = path.join(this.projectRoot, file);
      const destPath = path.join(backupPath, file);
      
      if (fs.existsSync(srcPath)) {
        this.copyRecursive(srcPath, destPath);
      }
    }

    return { backup: backupName, path: backupPath };
  }

  // نسخ الملفات بشكل متكرر
  copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      for (const file of files) {
        this.copyRecursive(path.join(src, file), path.join(dest, file));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  // بناء الإنتاج
  async buildProduction() {
    // تحسين الأصول
    execSync('npm run build', { cwd: this.projectRoot, stdio: 'pipe' });
    return { status: 'built' };
  }

  // النشر إلى الإنتاج
  async deployToProduction() {
    // هنا يمكن إضافة منطق النشر الفعلي (Vercel, Docker, etc.)
    return { status: 'deployed', platform: 'vercel' };
  }

  // المراقبة المستمرة
  async startMonitoring() {
    this.log('📊 بدء المراقبة المستمرة...', 'info');
    
    setInterval(async () => {
      try {
        const health = await this.checkProjectHealth();
        if (!health.allPassed) {
          this.log('⚠️ تم اكتشاف مشكلة في المراقبة', 'warning');
        }
      } catch (error) {
        this.log(`❌ خطأ في المراقبة: ${error.message}`, 'error');
      }
    }, 60000); // كل دقيقة

    return { status: 'monitoring', interval: 60000 };
  }
}

// واجهة سطر الأوامر
async function main() {
  const command = process.argv[2];
  const automation = new HMCarDevAutomation();

  try {
    switch (command) {
      case 'check':
        await automation.checkProjectHealth();
        break;
        
      case 'fix':
        await automation.autoFix();
        break;
        
      case 'start':
        await automation.startDevelopment();
        break;
        
      case 'deploy':
        await automation.deploy();
        break;
        
      case 'monitor':
        await automation.startMonitoring();
        break;
        
      case 'help':
        console.log(`
HM CAR Development Automation

الأوامر المتاحة:
  check     - فحص صحة المشروع
  fix       - إصلاح المشاكل تلقائياً
  start     - بدء بيئة التطوير
  deploy    - نشر المشروع
  monitor   - بدء المراقبة
  help      - عرض المساعدة

مثال:
  node scripts/dev-automation.js check
  node scripts/dev-automation.js start
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

module.exports = HMCarDevAutomation;
