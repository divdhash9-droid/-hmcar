/**
 * [[ملف الدخول الجديد]] - server-new.js
 * 
 * هذا هو الملف الرئيسي الجديد لتشغيل التطبيق المنظم
 * - استيراد التطبيق المنظم
 * - بدء التطبيق
 * - معالجة الأخطاء
 * 
 * @author HM CAR Team
 * @version 2.0.0
 */

// استيراد التطبيق المنظم
const App = require('./modules/app');

/**
 * دالة البدء الرئيسية
 */
async function main() {
  try {
    console.log('🚀 بدء تشغيل HM CAR - النسخة المنظمة');
    console.log('=====================================');
    
    // إنشاء وبدء التطبيق
    const app = new App();
    await app.start();
    
  } catch (error) {
    console.error('❌ فشل في بدء التطبيق:', error.message);
    console.error('=====================================');
    process.exit(1);
  }
}

// بدء التطبيق
main();
