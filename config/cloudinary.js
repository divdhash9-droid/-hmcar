// [[ARABIC_HEADER]] هذا الملف (config/cloudinary.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const path = require('path');
const fs = require('fs');
const multer = require('multer');

function ensureDir(p) {
  // إنشاء المجلد (والمجلدات الأب) إن لم تكن موجودة
  fs.mkdirSync(p, { recursive: true });
}

function createDiskStorage(subDir) {
  // إعداد تخزين محلي على القرص لرفع الملفات عبر multer
  // كل نوع من الملفات يوضع داخل مجلد فرعي مختلف داخل uploads/
  const dest = path.join(__dirname, '..', 'uploads', subDir);
  ensureDir(dest);

  return multer.diskStorage({
    // مكان حفظ الملف على القرص
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      // إنشاء اسم ملف آمن + امتداد مضبوط (نسمح فقط بصيغ صور محددة)
      const ext = path.extname(String(file.originalname || '')).toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
      cb(null, name);
    }
  });
}

// مخازن رفع الملفات حسب نوع المحتوى
const carImageStorage = createDiskStorage('cars');
const sparePartImageStorage = createDiskStorage('spare-parts');
const brandLogoStorage = createDiskStorage('brands');
const categoryImageStorage = createDiskStorage('categories');

module.exports = {
  carImageStorage,
  sparePartImageStorage,
  brandLogoStorage,
  categoryImageStorage
};
