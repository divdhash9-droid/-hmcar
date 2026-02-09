// [[ARABIC_HEADER]] هذا الملف (helpers/assetHelper.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
//
// مساعد تحميل الموارد الموحد
// يضمن تحميل الموارد بشكل موحد في جميع البيئات

const path = require('path');

class AssetHelper {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.basePath = this.isProduction ? '' : '';
    this.assetVersion = Date.now(); // للتحكم في التخزين المؤقت
  }

  /**
   * الحصول على مسار CSS الموحد
   */
  getCssPath(filename) {
    const versionedPath = `${this.basePath}/public/css/${filename}?v=${this.assetVersion}`;
    return versionedPath;
  }

  /**
   * الحصول على مسار JS الموحد
   */
  getJsPath(filename) {
    const versionedPath = `${this.basePath}/public/js/${filename}?v=${this.assetVersion}`;
    return versionedPath;
  }

  /**
   * الحصول على مسار الصور الموحد
   */
  getImagePath(filename) {
    return `${this.basePath}/public/images/${filename}`;
  }

  /**
   * الحصول على مسار الملفات المرفوعة
   */
  getUploadPath(filename) {
    // للملفات المرفوعة، نستخدم مسار مطلق
    if (filename.startsWith('http')) {
      return filename; // رابط خارجي
    }
    return `${this.basePath}/uploads/${filename}`;
  }

  /**
   * إنشاء علامات ربط CSS متعددة
   */
  generateCssTags(filenames) {
    return filenames
      .map((filename) => `<link rel="stylesheet" href="${this.getCssPath(filename)}">`)
      .join('\n');
  }

  /**
   * إنشاء علامات ربط JS متعددة
   */
  generateJsTags(filenames) {
    return filenames
      .map((filename) => `<script src="${this.getJsPath(filename)}"></script>`)
      .join('\n');
  }

  /**
   * الحصول على إعدادات التخزين المؤقت المناسبة
   */
  getCacheSettings() {
    return {
      maxAge: this.isProduction ? '1d' : '0',
      etag: true,
      lastModified: true,
      immutable: this.isProduction,
    };
  }

  /**
   * التحقق من صحة مسار الملف
   */
  isValidAssetPath(filepath) {
    const allowedPaths = ['/public/', '/uploads/', '/css/', '/js/', '/images/', '/vendor/'];
    return allowedPaths.some((allowed) => filepath.startsWith(allowed));
  }
}

// تصدير نسخة واحدة (Singleton)
module.exports = new AssetHelper();
