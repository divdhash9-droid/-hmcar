// [[ARABIC_HEADER]] هذا الملف (services/CDNService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs').promises;

class CDNService {
  constructor() {
    this.isConfigured = false;
    this.fallbackPath = '/uploads';
    this.init();
  }

  init() {
    // Configure Cloudinary if credentials are available
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      this.isConfigured = true;
      console.log('✅ CDN (Cloudinary) configured');
    } else {
      console.log('⚠️ CDN not configured, using local storage');
    }
  }

  // Upload image to CDN
  async uploadImage(filePath, folder = 'hm-car') {
    if (!this.isConfigured) {
      return this.getFallbackUrl(filePath);
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        responsive_breakpoints: {
          create_derived: true,
          bytes_step: 20000,
          min_width: 200,
          max_width: 1000,
          max_images: 5
        }
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('CDN upload error:', error);
      return this.getFallbackUrl(filePath);
    }
  }

  // Upload multiple images
  async uploadMultipleImages(filePaths, folder = 'hm-car') {
    const uploadPromises = filePaths.map(filePath => this.uploadImage(filePath, folder));
    return Promise.all(uploadPromises);
  }

  // Get optimized image URL
  getOptimizedUrl(publicId, options = {}) {
    if (!this.isConfigured) {
      return this.getFallbackUrl(publicId);
    }

    const {
      width,
      height,
      quality = 'auto',
      format = 'auto',
      crop = 'limit',
      gravity = 'auto'
    } = options;

    let transformation = [];

    if (width || height) {
      transformation.push({
        width,
        height,
        crop,
        gravity
      });
    }

    transformation.push({
      quality,
      format
    });

    return cloudinary.url(publicId, {
      transformation,
      secure: true,
      responsive: true,
      fetch_format: 'auto'
    });
  }

  // Get thumbnail URL
  getThumbnailUrl(publicId, width = 200, height = 200) {
    return this.getOptimizedUrl(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto'
    });
  }

  // Get responsive image URLs for different screen sizes
  getResponsiveUrls(publicId) {
    if (!this.isConfigured) {
      return {
        small: this.getFallbackUrl(publicId),
        medium: this.getFallbackUrl(publicId),
        large: this.getFallbackUrl(publicId)
      };
    }

    return {
      small: this.getOptimizedUrl(publicId, { width: 400, height: 300 }),
      medium: this.getOptimizedUrl(publicId, { width: 800, height: 600 }),
      large: this.getOptimizedUrl(publicId, { width: 1200, height: 900 })
    };
  }

  // Delete image from CDN
  async deleteImage(publicId) {
    if (!this.isConfigured) {
      return true;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('CDN delete error:', error);
      return false;
    }
  }

  // Delete multiple images
  async deleteMultipleImages(publicIds) {
    const deletePromises = publicIds.map(publicId => this.deleteImage(publicId));
    return Promise.all(deletePromises);
  }

  // Get image info
  async getImageInfo(publicId) {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        url: result.secure_url
      };
    } catch (error) {
      console.error('CDN info error:', error);
      return null;
    }
  }

  // Create image transformation for specific use case
  getTransformation(useCase) {
    const transformations = {
      thumbnail: {
        width: 150,
        height: 150,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto'
      },
      card: {
        width: 300,
        height: 200,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto'
      },
      gallery: {
        width: 800,
        height: 600,
        crop: 'limit',
        gravity: 'auto',
        quality: 'auto'
      },
      hero: {
        width: 1920,
        height: 1080,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto'
      },
      mobile: {
        width: 400,
        height: 300,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto'
      }
    };

    return transformations[useCase] || transformations.card;
  }

  // Get URL with specific transformation
  getUrlWithTransformation(publicId, useCase) {
    const transformation = this.getTransformation(useCase);
    return this.getOptimizedUrl(publicId, transformation);
  }

  // Fallback to local storage
  getFallbackUrl(filePath) {
    if (filePath.startsWith('http')) {
      return filePath;
    }
    return `${this.fallbackPath}/${filePath}`;
  }

  // Check if CDN is available
  isAvailable() {
    return this.isConfigured;
  }

  // Get CDN usage statistics
  async getUsageStats() {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const result = await cloudinary.api.usage();
      return {
        bandwidth: result.bandwidth,
        storage: result.storage,
        transformations: result.transformations,
        objects: result.objects
      };
    } catch (error) {
      console.error('CDN stats error:', error);
      return null;
    }
  }

  // Generate image placeholder (blur effect)
  getPlaceholderUrl(publicId, width = 10, height = 10) {
    if (!this.isConfigured) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PC9zdmc+';
    }

    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill' },
        { quality: 1, format: 'jpg' }
      ],
      secure: true
    });
  }

  // Bulk upload with progress tracking
  async bulkUpload(filePaths, folder = 'hm-car', onProgress) {
    const results = [];
    const total = filePaths.length;

    for (let i = 0; i < filePaths.length; i++) {
      const result = await this.uploadImage(filePaths[i], folder);
      results.push(result);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100)
        });
      }
    }

    return results;
  }

  // Create image gallery with multiple sizes
  async createImageGallery(publicId) {
    if (!this.isConfigured) {
      return {
        thumbnail: this.getFallbackUrl(publicId),
        small: this.getFallbackUrl(publicId),
        medium: this.getFallbackUrl(publicId),
        large: this.getFallbackUrl(publicId),
        original: this.getFallbackUrl(publicId)
      };
    }

    return {
      thumbnail: this.getThumbnailUrl(publicId),
      small: this.getOptimizedUrl(publicId, { width: 400, height: 300 }),
      medium: this.getOptimizedUrl(publicId, { width: 800, height: 600 }),
      large: this.getOptimizedUrl(publicId, { width: 1200, height: 900 }),
      original: cloudinary.url(publicId, { secure: true })
    };
  }

  // Watermark image
  addWatermark(publicId, watermarkText = 'HM CAR') {
    if (!this.isConfigured) {
      return this.getFallbackUrl(publicId);
    }

    return cloudinary.url(publicId, {
      transformation: [
        { overlay: { text: watermarkText, font_family: 'Arial', font_size: 60, font_weight: 'bold' } },
        { color: '#ffffff', opacity: 50 },
        { gravity: 'south_east', x: 20, y: 20 }
      ],
      secure: true
    });
  }
}

// Singleton instance
const cdnService = new CDNService();

module.exports = cdnService;
