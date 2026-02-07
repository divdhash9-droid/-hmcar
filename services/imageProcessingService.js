// [[ARABIC_HEADER]] هذا الملف (services/imageProcessingService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
// خدمة متقدمة لمعالجة الصور مع Sharp - ضغط وتحسين وتحجيم الصور

const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

/**
 * خيارات معالجة الصور المختلفة
 */
const IMAGE_CONFIGS = {
  // صور عالية الجودة للمعارض الرئيسية
  gallery: {
    width: 1200,
    height: 800,
    quality: 85,
    format: 'webp',
    fit: 'cover'
  },
  
  // صور مصغرة للقوائم
  thumbnail: {
    width: 400,
    height: 300,
    quality: 80,
    format: 'webp',
    fit: 'cover'
  },
  
  // صور صغيرة جدًا للأيقونات
  icon: {
    width: 100,
    height: 100,
    quality: 75,
    format: 'webp',
    fit: 'cover'
  },
  
  // صور أصلية محسّنة
  original: {
    quality: 90,
    format: 'webp',
    fit: 'cover'
  }
};

/**
 * التحقق من نوع الملف
 */
function isValidImageType(mimetype) {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mimetype);
}

/**
 * إنشاء اسم ملف فريد
 */
function generateUniqueFilename(originalname, suffix = '') {
  const ext = path.extname(originalname || '') || '.webp';
  const base = path.basename(originalname || 'image', path.extname(originalname || ''));
  const cleanBase = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 50);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}_${random}_${cleanBase}${suffix}${ext}`;
}

/**
 * معالجة صورة واحدة مع أحجام متعددة
 */
async function processImage(buffer, options = {}) {
  const {
    configs = ['thumbnail', 'gallery'],
    metadata = {},
    folder = 'processed'
  } = options;

  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Invalid image buffer provided');
  }

  const results = {};
  const imageInfo = await sharp(buffer).metadata();

  for (const configName of configs) {
    const config = IMAGE_CONFIGS[configName];
    if (!config) continue;

    try {
      let processor = sharp(buffer);

      // تطبيق الأبعاد إذا كانت محددة
      if (config.width && config.height) {
        processor = processor.resize(config.width, config.height, {
          fit: config.fit || 'cover',
          position: 'center'
        });
      }

      // تطبيق الجودة والتنسيق
      if (config.format === 'webp') {
        processor = processor.webp({
          quality: config.quality,
          effort: 6,
          smartSubsample: true
        });
      } else if (config.format === 'jpeg') {
        processor = processor.jpeg({
          quality: config.quality,
          progressive: true
        });
      } else if (config.format === 'png') {
        processor = processor.png({
          quality: config.quality,
          compressionLevel: 9
        });
      }

      // إضافة بيانات وصفية
      if (metadata.title || metadata.description) {
        processor = processor.withMetadata({
          exif: {
            IFD0: {
              ImageDescription: metadata.title || metadata.description || ''
            }
          }
        });
      }

      const processedBuffer = await processor.toBuffer();
      results[configName] = {
        buffer: processedBuffer,
        size: processedBuffer.length,
        width: config.width || imageInfo.width,
        height: config.height || imageInfo.height,
        format: config.format,
        quality: config.quality
      };

    } catch (error) {
      console.error(`Error processing image with config ${configName}:`, error);
      // في حالة الفشل، نستخدم الصورة الأصلية
      results[configName] = {
        buffer: buffer,
        size: buffer.length,
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
        quality: 100
      };
    }
  }

  return results;
}

/**
 * حفظ الصور المعالجة في المجلدات
 */
async function saveProcessedImages(processedImages, folder = 'images', originalname = '') {
  const uploadsRoot = path.join(__dirname, '..', 'uploads');
  const targetDir = path.join(uploadsRoot, folder);
  
  await fs.mkdir(targetDir, { recursive: true });

  const savedPaths = {};

  for (const [configName, imageData] of Object.entries(processedImages)) {
    const filename = generateUniqueFilename(originalname, `_${configName}`);
    const filepath = path.join(targetDir, filename);
    
    await fs.writeFile(filepath, imageData.buffer);
    savedPaths[configName] = `/uploads/${folder}/${filename}`;
  }

  return savedPaths;
}

/**
 * معالجة وحفظ صورة كاملة
 */
async function processAndSaveImage(buffer, options = {}) {
  const {
    folder = 'images',
    originalname = '',
    configs = ['thumbnail', 'gallery'],
    metadata = {}
  } = options;

  try {
    // معالجة الصورة
    const processedImages = await processImage(buffer, {
      configs,
      metadata,
      folder
    });

    // حفظ الصور
    const savedPaths = await saveProcessedImages(processedImages, folder, originalname);

    return {
      success: true,
      paths: savedPaths,
      metadata: processedImages
    };

  } catch (error) {
    console.error('Error in processAndSaveImage:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إنشاء صورة بديلة نائبة (placeholder)
 */
async function createPlaceholderImage(width = 400, height = 300, text = 'No Image') {
  try {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
              text-anchor="middle" dy=".3em" fill="#666">${text}</text>
      </svg>
    `;

    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    return buffer;
  } catch (error) {
    console.error('Error creating placeholder:', error);
    return null;
  }
}

/**
 * تحسين الصورة للويب (تقليل الحجم مع الحفاظ على الجودة)
 */
async function optimizeForWeb(buffer, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'webp'
  } = options;

  try {
    const imageInfo = await sharp(buffer).metadata();
    
    let processor = sharp(buffer);

    // تصغير الصورة إذا كانت كبيرة جدًا
    if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
      processor = processor.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // تطبيق التنسيق والجودة
    if (format === 'webp') {
      processor = processor.webp({ quality, effort: 6 });
    } else if (format === 'jpeg') {
      processor = processor.jpeg({ quality, progressive: true });
    }

    return await processor.toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    return buffer; // إرجاع الصورة الأصلية في حالة الفشل
  }
}

module.exports = {
  processImage,
  saveProcessedImages,
  processAndSaveImage,
  createPlaceholderImage,
  optimizeForWeb,
  isValidImageType,
  generateUniqueFilename,
  IMAGE_CONFIGS
};
