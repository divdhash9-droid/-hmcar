// [[ARABIC_HEADER]] هذا الملف (scripts/production-backup.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Production Backup Script
 * سكريبت النسخ الاحتياطي لقاعدة البيانات
 * يقوم بحفظ نسخة من البيانات بشكل آمن لضمان عدم فقدانها.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const backupDir = path.join(__dirname, '../backups');

// إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجوداً
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hmcar-backup-${timestamp}`;
  const backupPath = path.join(backupDir, filename);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI غير موجود في ملف .env');
    return;
  }

  console.log(`⏳ جاري بدء النسخ الاحتياطي إلى: ${filename}...`);

  // استخدام mongodump للنسخ الاحتياطي
  // ملاحظة: يتطلب وجود أدوات MongoDB installed على السيرفر
  const command = `mongodump --uri="${mongoUri}" --out="${backupPath}" --gzip`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ فشل النسخ الاحتياطي: ${error.message}`);
      return;
    }
    
    console.log(`✅ تم النسخ الاحتياطي بنجاح!`);
    console.log(`📂 الموقع: ${backupPath}`);
    
    // تنظيف النسخ القديمة (أقدم من 7 أيام)
    cleanOldBackups();
  });
}

function cleanOldBackups() {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const weekInMs = 7 * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > weekInMs) {
      console.log(`🧹 حذف نسخة قديمة: ${file}`);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  });
}

// تشغيل النسخ
runBackup();
