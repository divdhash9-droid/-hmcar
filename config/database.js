/**
 * config/database.js
 * قاعدة بيانات وهمية للتطوير المحلي - بدون Firebase
 * 
 * الوصف:
 * - هذا الملف يوفر واجهة وهمية (Mock) لقاعدة البيانات
 * - يُستخدم عند التطوير المحلي بدلاً من Firebase Realtime Database
 * - جميع العمليات ترجع Promise فارغ للتوافق مع الكود الموجود
 * 
 * ملاحظة: المشروع يستخدم MongoDB كقاعدة بيانات رئيسية
 */

const mockDatabase = {
  // إنشاء مرجع لمسار معين في قاعدة البيانات الوهمية
  ref: (path) => ({
    // حفظ بيانات
    set: (data) => Promise.resolve(),
    // جلب بيانات
    get: () => Promise.resolve({ exists: () => false }),
    // إضافة عنصر جديد بمعرف تلقائي
    push: (data) => Promise.resolve({ key: Math.random().toString(36) }),
    // تحديث بيانات
    update: (data) => Promise.resolve(),
    // حذف بيانات
    remove: () => Promise.resolve(),
    // الاستماع للتغييرات (Realtime)
    onValue: (callback) => {
      callback({ exists: () => false });
      return () => {}; // دالة إلغاء الاشتراك
    }
  })
};

module.exports = { 
  database: mockDatabase, 
  ref: mockDatabase.ref, 
  set: () => Promise.resolve(), 
  get: () => Promise.resolve({ exists: () => false }), 
  push: () => Promise.resolve({ key: Math.random().toString(36) }), 
  update: () => Promise.resolve(), 
  remove: () => Promise.resolve(), 
  onValue: (callback) => {
    callback({ exists: () => false });
    return () => {};
  }
};
