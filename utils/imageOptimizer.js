// [[ARABIC_HEADER]] هذا الملف (utils/imageOptimizer.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * تحسين الصورة وضغطها
 */
async function optimizeImage(inputBuffer, options = {}) {
  const {
    width = 1200,
    height = 800,
    quality = 80,
    format = 'webp'
  } = options;

  try {
    const optimized = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    return optimized;
  } catch (error) {
    console.error('❌ Image optimization error:', error.message);
    return inputBuffer; // إرجاع الصورة الأصلية في حالة الخطأ
  }
}

/**
 * إنشاء صورة مصغرة (Thumbnail)
 */
async function createThumbnail(inputBuffer, options = {}) {
  const {
    width = 300,
    height = 200,
    quality = 70
  } = options;

  try {
    const thumbnail = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('❌ Thumbnail creation error:', error.message);
    return null;
  }
}

/**
 * تحسين صورة من ملف
 */
async function optimizeImageFile(inputPath, outputPath, options = {}) {
  try {
    const buffer = await fs.readFile(inputPath);
    const optimized = await optimizeImage(buffer, options);
    await fs.writeFile(outputPath, optimized);
    
    const originalSize = buffer.length;
    const optimizedSize = optimized.length;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
    
    console.log(`✅ Image optimized: ${path.basename(inputPath)}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(2)} KB`);
    console.log(`   Savings: ${savings}%`);
    
    return optimized;
  } catch (error) {
    console.error('❌ File optimization error:', error.message);
    throw error;
  }
}

/**
 * تحسين مجموعة من الصور
 */
async function optimizeMultipleImages(files, options = {}) {
  const results = [];
  
  for (const file of files) {
    try {
      const optimized = await optimizeImage(file.buffer, options);
      results.push({
        originalName: file.originalname,
        buffer: optimized,
        size: optimized.length
      });
    } catch (error) {
      console.error(`❌ Error optimizing ${file.originalname}:`, error.message);
      results.push({
        originalName: file.originalname,
        buffer: file.buffer,
        size: file.buffer.length,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Middleware لتحسين الصور المرفوعة
 */
function imageOptimizationMiddleware(options = {}) {
  return async (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    try {
      // ملف واحد
      if (req.file) {
        const optimized = await optimizeImage(req.file.buffer, options);
        req.file.buffer = optimized;
        req.file.size = optimized.length;
      }

      // ملفات متعددة
      if (req.files) {
        if (Array.isArray(req.files)) {
          for (let i = 0; i < req.files.length; i++) {
            const optimized = await optimizeImage(req.files[i].buffer, options);
            req.files[i].buffer = optimized;
            req.files[i].size = optimized.length;
          }
        } else {
          // ملفات متعددة بأسماء حقول مختلفة
          for (const fieldName in req.files) {
            for (let i = 0; i < req.files[fieldName].length; i++) {
              const optimized = await optimizeImage(req.files[fieldName][i].buffer, options);
              req.files[fieldName][i].buffer = optimized;
              req.files[fieldName][i].size = optimized.length;
            }
          }
        }
      }

      next();
    } catch (error) {
      console.error('❌ Image optimization middleware error:', error.message);
      next(); // المتابعة حتى في حالة الخطأ
    }
  };
}

module.exports = {
  optimizeImage,
  createThumbnail,
  optimizeImageFile,
  optimizeMultipleImages,
  imageOptimizationMiddleware
};
