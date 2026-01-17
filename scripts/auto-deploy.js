// [[ARABIC_HEADER]] هذا الملف (scripts/auto-deploy.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * HM CAR - Auto Deploy Script
 * النشر التلقائي للتغييرات
 * 
 * يراقب التغييرات وينشر تلقائياً على Vercel
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  watchDirs: ['views', 'public', 'routes', 'models', 'services', 'middleware'],
  watchExtensions: ['.js', '.ejs', '.css', '.json'],
  debounceTime: 5000, // Wait 5 seconds after last change before deploying
  projectRoot: path.join(__dirname, '..'),
};

let deployTimer = null;
let isDeploying = false;
let changeCount = 0;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString('ar-SA');
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logArabic(message, color = 'reset') {
  log(`🚀 ${message}`, color);
}

// Deploy to Vercel
function deployToVercel() {
  if (isDeploying) {
    logArabic('النشر جاري بالفعل... انتظر', 'yellow');
    return;
  }

  isDeploying = true;
  logArabic(`بدء النشر التلقائي (${changeCount} تغييرات)...`, 'cyan');
  changeCount = 0;

  const deploy = spawn('vercel', ['--prod', '--yes'], {
    cwd: CONFIG.projectRoot,
    shell: true,
    stdio: 'pipe',
  });

  let output = '';

  deploy.stdout.on('data', (data) => {
    output += data.toString();
    process.stdout.write(data);
  });

  deploy.stderr.on('data', (data) => {
    output += data.toString();
    process.stderr.write(data);
  });

  deploy.on('close', (code) => {
    isDeploying = false;
    
    if (code === 0) {
      // Extract deployment URL
      const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
      const url = urlMatch ? urlMatch[0] : 'https://hmcar.vercel.app';
      
      logArabic('✅ تم النشر بنجاح!', 'green');
      logArabic(`🌐 الرابط: ${url}`, 'blue');
      
      // Show notification (Windows)
      showNotification('HM CAR', 'تم النشر بنجاح على Vercel!');
    } else {
      logArabic('❌ فشل النشر!', 'red');
    }
  });
}

// Show Windows notification
function showNotification(title, message) {
  const script = `
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $textNodes = $template.GetElementsByTagName("text")
    $textNodes.Item(0).AppendChild($template.CreateTextNode("${title}")) | Out-Null
    $textNodes.Item(1).AppendChild($template.CreateTextNode("${message}")) | Out-Null
    $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("HM CAR").Show($toast)
  `;
  
  exec(`powershell -command "${script.replace(/"/g, '\\"')}"`, { shell: true });
}

// Schedule deployment with debounce
function scheduleDeployment() {
  changeCount++;
  
  if (deployTimer) {
    clearTimeout(deployTimer);
  }
  
  logArabic(`تم رصد تغيير (${changeCount})... سيتم النشر خلال ${CONFIG.debounceTime / 1000} ثواني`, 'yellow');
  
  deployTimer = setTimeout(() => {
    deployToVercel();
  }, CONFIG.debounceTime);
}

// Watch for file changes
function watchFiles() {
  logArabic('🔍 بدء مراقبة الملفات للنشر التلقائي...', 'cyan');
  logArabic(`📁 المجلدات المراقبة: ${CONFIG.watchDirs.join(', ')}`, 'blue');
  
  CONFIG.watchDirs.forEach(dir => {
    const fullPath = path.join(CONFIG.projectRoot, dir);
    
    if (fs.existsSync(fullPath)) {
      fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          const ext = path.extname(filename);
          if (CONFIG.watchExtensions.includes(ext)) {
            logArabic(`📝 تغيير في: ${dir}/${filename}`, 'yellow');
            scheduleDeployment();
          }
        }
      });
      
      logArabic(`✅ مراقبة: ${dir}`, 'green');
    }
  });
  
  logArabic('', 'reset');
  logArabic('='.repeat(50), 'cyan');
  logArabic('🚀 نظام النشر التلقائي جاهز!', 'green');
  logArabic('📌 أي تعديل سيُنشر تلقائياً على Vercel', 'blue');
  logArabic('='.repeat(50), 'cyan');
  logArabic('', 'reset');
}

// Start watching
watchFiles();

// Handle process termination
process.on('SIGINT', () => {
  logArabic('إيقاف النشر التلقائي...', 'yellow');
  process.exit(0);
});

console.log('\n📋 للإيقاف اضغط Ctrl+C\n');
