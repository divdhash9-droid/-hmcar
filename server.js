// [[ARABIC_HEADER]] هذا الملف (server.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * @file server.js
 * @description ملف نقطة الانطلاق الرئيسي لخادم HM CAR.
 * يقوم هذا الملف باستيراد تطبيق النظام وتشغيله مع معالجة الأخطاء الأساسية.
 */

// استيراد وحدة التطبيق المركزية
const App = require('./modules/app');

/**
 * الوظيفة الرئيسية لتشغيل السيرفر
 */
async function startServer() {
  try {
    console.log('-------------------------------------------');
    console.log('🚀 نظام HM CAR قيد التشغيل...');
    console.log('-------------------------------------------');

    // إنشاء كائن التطبيق وبدء التشغيل
    const app = new App();
    await app.start();

    console.log('✅ تم تشغيل جميع الوحدات والخدمات بنجاح.');
  } catch (error) {
    console.error('❌ خطأ فادح أثناء تشغيل النظام:');
    console.error(error.message);
    console.log('-------------------------------------------');
    process.exit(1); // إغلاق النظام في حال وجود خطأ فادح
  }
}

// البدء الفعلي للتطبيق
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
