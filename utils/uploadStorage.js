// [[ARABIC_HEADER]] هذا الملف (utils/uploadStorage.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
// مساعد تخزين ملفات Multer (memoryStorage) محلياً داخل مجلد uploads وإرجاع رابط يمكن عرضه.

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

function safeSegment(input) {
  return String(input || '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'file';
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * يحفظ ملف Multer (memoryStorage) إلى uploads/<folder>/... ويعيد مسار URL يبدأ بـ /uploads/
 * @param {object} file - req.file أو عنصر من req.files
 * @param {string} folder - مثل: 'cars', 'brands', 'spare-parts'
 * @returns {Promise<string|null>} webPath مثل: /uploads/cars/170..._abc.png
 */
async function saveMulterFileToUploads(file, folder = 'misc') {
  if (!file) return null;

  // إذا كان multer يستخدم diskStorage وقد أعطى path بالفعل
  if (file.path) {
    const rel = String(file.path).replace(/\\/g, '/');
    const idx = rel.toLowerCase().lastIndexOf('/uploads/');
    if (idx >= 0) return rel.slice(idx);
    return rel;
  }

  const uploadsRoot = path.join(__dirname, '..', 'uploads');
  const targetDir = path.join(uploadsRoot, folder);
  await ensureDir(targetDir);

  const ext = path.extname(file.originalname || '') || (file.mimetype === 'image/webp' ? '.webp' : file.mimetype === 'image/png' ? '.png' : '.jpg');
  const base = safeSegment(path.basename(file.originalname || 'upload', path.extname(file.originalname || '')));
  const rand = crypto.randomBytes(6).toString('hex');
  const filename = `${Date.now()}_${rand}_${base}${ext}`;

  const outPath = path.join(targetDir, filename);
  await fs.writeFile(outPath, file.buffer);

  return `/uploads/${folder}/${filename}`;
}

module.exports = {
  saveMulterFileToUploads,
};
