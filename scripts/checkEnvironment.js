// [[ARABIC_HEADER]] هذا الملف (scripts/checkEnvironment.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// نص فحص البيئة
// ينفذ فحص شامل لبيئة المشروع

require('dotenv').config();
const environmentChecker = require('../helpers/environmentChecker');

async function runEnvironmentCheck() {
  console.log('🚀 بدء فحص بيئة المشروع...\n');

  try {
    // تنفيذ الفحص الشامل
    const report = await environmentChecker.checkAll();

    // عرض التقرير
    environmentChecker.displayReport(report);

    // حفظ التقرير في ملف
    const fs = require('fs');
    const path = require('path');

    const reportPath = path.join(__dirname, '..', 'logs', 'environment-check-report.json');

    // التأكد من وجود مجلد logs
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // حفظ التقرير
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 تم حفظ التقرير في: ${reportPath}`);

    // إنهاء العملية حسب الحالة
    if (report.overallStatus === 'error') {
      console.log('\n❌ تم العثور على أخطاء حرجة. يُرجى إصلاحها قبل التشغيل.');
      process.exit(1);
    } else if (report.overallStatus === 'warning') {
      console.log('\n⚠️  تم العثور على تحذيرات. يُوصى بمعالجتها لتحسين الأداء والأمان.');
      process.exit(0);
    } else {
      console.log('\n✅ البيئة سليمة وجاهزة للتشغيل!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ خطأ في فحص البيئة:', error.message);
    process.exit(1);
  }
}

// تنفيذ الفحص
if (require.main === module) {
  runEnvironmentCheck();
}

module.exports = { runEnvironmentCheck };
