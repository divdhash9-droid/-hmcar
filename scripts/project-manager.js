#!/usr/bin/env node

/**
 * [[ARABIC_HEADER]] هذا الملف (scripts/project-manager.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
 * 
 * مدير المشروع المتكامل لـ HM CAR
 * - إدارة المشاريع الفرعية
 * - التحكم في الإصدارات
 * - إدارة الميزات
 * - التكامل المستمر
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class ProjectManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'project-config.json');
    this.config = this.loadConfig();
  }

  // تحميل الإعدادات
  loadConfig() {
    if (fs.existsSync(this.configPath)) {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    }
    
    // إعدادات افتراضية
    const defaultConfig = {
      name: 'HM CAR Auction',
      version: '2.0.0',
      description: 'منصة متكاملة لمزادات السيارات',
      modules: {
        admin: { enabled: true, version: '1.0.0' },
        client: { enabled: true, version: '1.0.0' },
        api: { enabled: true, version: '1.0.0' },
        database: { enabled: true, version: '1.0.0' }
      },
      features: {
        auctions: { enabled: true, status: 'stable' },
        users: { enabled: true, status: 'stable' },
        payments: { enabled: false, status: 'development' },
        analytics: { enabled: true, status: 'beta' }
      },
      deployment: {
        environments: ['development', 'staging', 'production'],
        current: 'development',
        autoDeploy: false
      }
    };
    
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  // حفظ الإعدادات
  saveConfig(config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  // تسجيل الأحداث
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      module: chalk.cyan,
      feature: chalk.magenta
    };
    
    console.log(colors[type](`[${timestamp}] ${message}`));
  }

  // عرض حالة المشروع
  async showStatus() {
    this.log('📊 حالة المشروع الحالية:', 'info');
    console.log(chalk.cyan(`\n📋 ${this.config.name} v${this.config.version}`));
    console.log(chalk.gray(this.config.description));
    
    console.log(chalk.yellow('\n🔧 الوحدات النمطية:'));
    for (const [module, info] of Object.entries(this.config.modules)) {
      const status = info.enabled ? '✅' : '❌';
      console.log(`  ${status} ${module}: v${info.version}`);
    }
    
    console.log(chalk.magenta('\n🚀 الميزات:'));
    for (const [feature, info] of Object.entries(this.config.features)) {
      const status = info.enabled ? '✅' : '❌';
      const statusColor = {
        stable: chalk.green,
        beta: chalk.yellow,
        development: chalk.blue,
        disabled: chalk.gray
      }[info.status] || chalk.gray;
      
      console.log(`  ${status} ${feature}: ${statusColor(info.status)}`);
    }
    
    console.log(chalk.blue('\n🌍 البيئات:'));
    console.log(`  📍 الحالية: ${chalk.green(this.config.deployment.current)}`);
    console.log(`  🔄 النشر التلقائي: ${this.config.deployment.autoDeploy ? '✅' : '❌'}`);
    
    return this.config;
  }

  // إضافة ميزة جديدة
  async addFeature(name, options = {}) {
    this.log(`🚀 إضافة ميزة جديدة: ${name}`, 'feature');
    
    const featureConfig = {
      enabled: options.enabled || false,
      status: options.status || 'development',
      description: options.description || '',
      dependencies: options.dependencies || [],
      created: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // إنشاء مجلد الميزة
    const featureDir = path.join(this.projectRoot, 'features', name);
    if (!fs.existsSync(featureDir)) {
      fs.mkdirSync(featureDir, { recursive: true });
      
      // إنشاء ملفات الميزة
      await this.createFeatureFiles(name, featureDir, featureConfig);
    }
    
    // تحديث الإعدادات
    this.config.features[name] = featureConfig;
    this.saveConfig(this.config);
    
    this.log(`✅ تمت إضافة الميزة: ${name}`, 'success');
    return featureConfig;
  }

  // إنشاء ملفات الميزة
  async createFeatureFiles(name, dir, config) {
    const files = [
      {
        name: 'routes.js',
        content: this.generateFeatureRoutes(name)
      },
      {
        name: 'models.js',
        content: this.generateFeatureModels(name)
      },
      {
        name: 'controllers.js',
        content: this.generateFeatureControllers(name)
      },
      {
        name: 'middleware.js',
        content: this.generateFeatureMiddleware(name)
      },
      {
        name: 'views/',
        type: 'dir'
      },
      {
        name: 'tests/',
        type: 'dir'
      },
      {
        name: 'README.md',
        content: this.generateFeatureReadme(name, config)
      }
    ];

    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.type === 'dir') {
        fs.mkdirSync(filePath, { recursive: true });
      } else {
        fs.writeFileSync(filePath, file.content);
      }
    }
  }

  // توليد مسارات الميزة
  generateFeatureRoutes(name) {
    return `/**
 * مسارات ميزة ${name}
 */

const express = require('express');
const router = express.Router();

// GET /${name}
router.get('/', (req, res) => {
  res.json({ message: '${name} feature working' });
});

module.exports = router;`;
  }

  // توليد نماذج الميزة
  generateFeatureModels(name) {
    return `/**
 * نماذج ميزة ${name}
 */

const mongoose = require('mongoose');

const ${name}Schema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('${name}', ${name}Schema);`;
  }

  // توليد متحكمات الميزة
  generateFeatureControllers(name) {
    return `/**
 * متحكمات ميزة ${name}
 */

class ${name}Controller {
  // الحصول على كل العناصر
  static async getAll(req, res) {
    try {
      // منطق الحصول على العناصر
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ${name}Controller;`;
  }

  // توليد وسطاء الميزة
  generateFeatureMiddleware(name) {
    return `/**
 * وسطاء ميزة ${name}
 */

const ${name}Middleware = {
  // التحقق من الصلاحيات
  checkPermission: (req, res, next) => {
    // منطق التحقق
    next();
  }
};

module.exports = ${name}Middleware;`;
  }

  // توليد README الميزة
  generateFeatureReadme(name, config) {
    return `# ميزة ${name}

${config.description}

## الحالة
- الحالة: ${config.status}
- مفعلة: ${config.enabled ? 'نعم' : 'لا'}
- الإصدار: ${config.version}

## الاعتماديات
${config.dependencies.length > 0 ? config.dependencies.join(', ') : 'لا توجد اعتماديات'}

## الاستخدام
\`\`\`javascript
// مثال الاستخدام
const ${name} = require('./${name}');
\`\`\`

## التطوير
- تم الإنشاء: ${config.created}
- المطور: HM CAR Team
`;
  }

  // تفعيل/تعطيل ميزة
  async toggleFeature(name, enabled) {
    if (!this.config.features[name]) {
      throw new Error(`الميزة "${name}" غير موجودة`);
    }
    
    this.config.features[name].enabled = enabled;
    this.saveConfig(this.config);
    
    const status = enabled ? 'تفعيل' : 'تعطيل';
    this.log(`✅ تم ${status} الميزة: ${name}`, 'success');
    
    return this.config.features[name];
  }

  // تحديث ميزة
  async updateFeature(name, updates) {
    if (!this.config.features[name]) {
      throw new Error(`الميزة "${name}" غير موجودة`);
    }
    
    Object.assign(this.config.features[name], updates);
    this.saveConfig(this.config);
    
    this.log(`✅ تم تحديث الميزة: ${name}`, 'success');
    return this.config.features[name];
  }

  // حذف ميزة
  async removeFeature(name) {
    if (!this.config.features[name]) {
      throw new Error(`الميزة "${name}" غير موجودة`);
    }
    
    // حذف الملفات
    const featureDir = path.join(this.projectRoot, 'features', name);
    if (fs.existsSync(featureDir)) {
      fs.rmSync(featureDir, { recursive: true, force: true });
    }
    
    // حذف من الإعدادات
    delete this.config.features[name];
    this.saveConfig(this.config);
    
    this.log(`✅ تم حذف الميزة: ${name}`, 'success');
    return true;
  }

  // إنشاء إصدار جديد
  async createVersion(type = 'patch') {
    const currentVersion = this.config.version;
    const newVersion = this.incrementVersion(currentVersion, type);
    
    this.log(`🚀 إنشاء إصدار جديد: ${currentVersion} → ${newVersion}`, 'info');
    
    // تحديث الإصدار في جميع الملفات
    await this.updateVersionFiles(newVersion);
    
    // إنشاء tag في Git
    try {
      execSync(`git add .`, { cwd: this.projectRoot, stdio: 'pipe' });
      execSync(`git commit -m "Release v${newVersion}"`, { cwd: this.projectRoot, stdio: 'pipe' });
      execSync(`git tag v${newVersion}`, { cwd: this.projectRoot, stdio: 'pipe' });
      
      this.log(`✅ تم إنشاء tag: v${newVersion}`, 'success');
    } catch (error) {
      this.log(`⚠️ لم يتم إنشاء tag: ${error.message}`, 'warning');
    }
    
    this.config.version = newVersion;
    this.saveConfig(this.config);
    
    return { oldVersion: currentVersion, newVersion: newVersion };
  }

  // زيادة الإصدار
  incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
      default:
        parts[2]++;
        break;
    }
    
    return parts.join('.');
  }

  // تحديث الإصدار في الملفات
  async updateVersionFiles(newVersion) {
    const filesToUpdate = [
      'package.json',
      'README.md',
      'server.js'
    ];
    
    for (const file of filesToUpdate) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // تحديث الإصدار في package.json
        if (file === 'package.json') {
          const packageJson = JSON.parse(content);
          packageJson.version = newVersion;
          content = JSON.stringify(packageJson, null, 2);
        } else {
          // تحديث الإصدار في الملفات الأخرى
          content = content.replace(/version:\s*['"]?(\d+\.\d+\.\d+)['"]?/g, `version: '${newVersion}'`);
        }
        
        fs.writeFileSync(filePath, content);
      }
    }
  }

  // تبديل البيئة
  async switchEnvironment(env) {
    if (!this.config.deployment.environments.includes(env)) {
      throw new Error(`البيئة "${env}" غير مدعومة`);
    }
    
    this.config.deployment.current = env;
    this.saveConfig(this.config);
    
    // تحديث متغيرات البيئة
    process.env.NODE_ENV = env;
    
    this.log(`✅ تم التبديل إلى البيئة: ${env}`, 'success');
    return env;
  }

  // تفعيل النشر التلقائي
  async enableAutoDeploy(platform = 'vercel') {
    this.config.deployment.autoDeploy = true;
    this.config.deployment.platform = platform;
    this.saveConfig(this.config);
    
    // إنشاء GitHub Actions workflow
    await this.createDeployWorkflow(platform);
    
    this.log(`✅ تم تفعيل النشر التلقائي إلى ${platform}`, 'success');
    return true;
  }

  // إنشاء workflow للنشر
  async createDeployWorkflow(platform) {
    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }
    
    const workflow = {
      name: 'Deploy to Production',
      on: {
        push: { branches: ['main'] }
      },
      jobs: {
        deploy: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v3' },
            { uses: 'actions/setup-node@v3', with: { 'node-version': '18' } },
            { run: 'npm ci' },
            { run: 'npm run build' },
            { run: `node scripts/quick-deploy.js auto` }
          ]
        }
      }
    };
    
    const workflowPath = path.join(workflowsDir, 'deploy.yml');
    fs.writeFileSync(workflowPath, `name: ${workflow.name}\n\non:\n  push:\n    branches: [main]\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: '18'\n      - run: npm ci\n      - run: npm run build\n      - run: node scripts/quick-deploy.js auto\n`);
  }

  // فحص جودة الكود
  async codeQuality() {
    this.log('🔍 فحص جودة الكود...', 'info');
    
    const checks = [
      { name: 'ESLint', command: 'npx eslint . --ext .js,.ejs' },
      { name: 'Prettier', command: 'npx prettier --check .' },
      { name: 'Security', command: 'npm audit' },
      { name: 'Dependencies', command: 'npm outdated' }
    ];
    
    const results = {};
    
    for (const check of checks) {
      try {
        execSync(check.command, { cwd: this.projectRoot, stdio: 'pipe' });
        results[check.name] = { status: 'pass' };
        this.log(`✅ ${check.name} - نجح`, 'success');
      } catch (error) {
        results[check.name] = { status: 'fail', error: error.message };
        this.log(`❌ ${check.name} - فشل`, 'error');
      }
    }
    
    return results;
  }

  // إنشاء تقرير المشروع
  async generateReport() {
    this.log('📊 إنشاء تقرير المشروع...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      project: {
        name: this.config.name,
        version: this.config.version,
        environment: this.config.deployment.current
      },
      modules: this.config.modules,
      features: this.config.features,
      codeQuality: await this.codeQuality(),
      statistics: await this.getProjectStatistics()
    };
    
    const reportPath = path.join(this.projectRoot, 'reports', `project-report-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`✅ تم إنشاء التقرير: ${reportPath}`, 'success');
    return report;
  }

  // الحصول على إحصائيات المشروع
  async getProjectStatistics() {
    const stats = {
      files: 0,
      lines: 0,
      size: 0
    };
    
    function countFiles(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          countFiles(fullPath);
        } else {
          stats.files++;
          stats.size += stat.size;
          
          if (fullPath.endsWith('.js') || fullPath.endsWith('.ejs')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            stats.lines += content.split('\n').length;
          }
        }
      }
    }
    
    countFiles(this.projectRoot);
    return stats;
  }
}

// واجهة سطر الأوامر
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  const manager = new ProjectManager();

  try {
    switch (command) {
      case 'status':
        await manager.showStatus();
        break;
        
      case 'add-feature':
        const featureName = args[0];
        const options = {
          enabled: args.includes('--enabled'),
          status: args.find(arg => arg.startsWith('--status='))?.split('=')[1] || 'development'
        };
        await manager.addFeature(featureName, options);
        break;
        
      case 'toggle-feature':
        await manager.toggleFeature(args[0], args[1] === 'true');
        break;
        
      case 'remove-feature':
        await manager.removeFeature(args[0]);
        break;
        
      case 'version':
        const versionType = args[0] || 'patch';
        await manager.createVersion(versionType);
        break;
        
      case 'env':
        await manager.switchEnvironment(args[0]);
        break;
        
      case 'auto-deploy':
        await manager.enableAutoDeploy(args[0]);
        break;
        
      case 'quality':
        await manager.codeQuality();
        break;
        
      case 'report':
        await manager.generateReport();
        break;
        
      case 'help':
        console.log(`
HM CAR Project Manager

الأوامر المتاحة:
  status                    - عرض حالة المشروع
  add-feature <name>        - إضافة ميزة جديدة
  toggle-feature <name>     - تفعيل/تعطيل ميزة
  remove-feature <name>     - حذف ميزة
  version [type]            - إنشاء إصدار جديد (patch/minor/major)
  env <environment>         - تبديل البيئة
  auto-deploy [platform]    - تفعيل النشر التلقائي
  quality                   - فحص جودة الكود
  report                    - إنشاء تقرير المشروع
  help                      - عرض المساعدة

مثال:
  node scripts/project-manager.js add-feature payments --enabled
  node scripts/project-manager.js version minor
  node scripts/project-manager.js env production
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

module.exports = ProjectManager;
