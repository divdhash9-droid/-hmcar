// [[ARABIC_HEADER]] هذا الملف (middleware/cdn.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const cdnService = require('../services/CDNService');

// CDN middleware for image optimization
const cdn = (options = {}) => {
  return (req, res, next) => {
    // Add CDN helper functions to response locals
    res.locals.cdn = {
      getUrl: (publicId, opts = {}) => cdnService.getOptimizedUrl(publicId, opts),
      getThumbnail: (publicId, width = 200, height = 200) => cdnService.getThumbnailUrl(publicId, width, height),
      getResponsive: (publicId) => cdnService.getResponsiveUrls(publicId),
      getGallery: (publicId) => cdnService.createImageGallery(publicId),
      getPlaceholder: (publicId) => cdnService.getPlaceholderUrl(publicId),
      getWatermark: (publicId, text) => cdnService.addWatermark(publicId, text),
      isAvailable: () => cdnService.isAvailable()
    };

    next();
  };
};

// Image optimization middleware for API responses
const optimizeImages = (imageField = 'images') => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      if (data && data[imageField] && Array.isArray(data[imageField])) {
        // Optimize each image in the array
        data[imageField] = data[imageField].map(image => {
          if (typeof image === 'string') {
            return {
              original: image,
              thumbnail: cdnService.getThumbnailUrl(image),
              responsive: cdnService.getResponsiveUrls(image)
            };
          }
          return image;
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// CDN upload middleware
const uploadToCDN = (folder = 'hm-car') => {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    try {
      const filePaths = req.files.map(file => file.path);
      const uploadResults = await cdnService.uploadMultipleImages(filePaths, folder);
      
      // Replace file paths with CDN URLs
      req.cdnFiles = uploadResults;
      req.files = req.files.map((file, index) => ({
        ...file,
        cdnUrl: uploadResults[index].url,
        publicId: uploadResults[index].publicId
      }));

      next();
    } catch (error) {
      console.error('CDN upload middleware error:', error);
      next();
    }
  };
};

// CDN cleanup middleware
const cleanupCDN = () => {
  return async (req, res, next) => {
    // Store original delete function
    const originalDelete = req.delete || function() {};

    req.delete = async function() {
      const result = await originalDelete.call(this);
      
      // If deletion was successful and we have CDN files, clean them up
      if (result && this.cdnFiles) {
        const publicIds = this.cdnFiles.map(file => file.publicId).filter(Boolean);
        if (publicIds.length > 0) {
          await cdnService.deleteMultipleImages(publicIds);
        }
      }

      return result;
    };

    next();
  };
};

// CDN statistics middleware
const cdnStats = async (req, res, next) => {
  try {
    const stats = await cdnService.getUsageStats();
    res.locals.cdnStats = stats;
  } catch (error) {
    console.error('CDN stats error:', error);
    res.locals.cdnStats = null;
  }

  next();
};

// Image transformation helper
const transformImage = (useCase = 'card') => {
  return (req, res, next) => {
    res.locals.transformImage = (publicId) => cdnService.getUrlWithTransformation(publicId, useCase);
    next();
  };
};

// Progressive image loading middleware
const progressiveImages = () => {
  return (req, res, next) => {
    res.locals.progressiveImage = (publicId) => ({
      placeholder: cdnService.getPlaceholderUrl(publicId),
      small: cdnService.getOptimizedUrl(publicId, { width: 20, height: 20, quality: 1 }),
      medium: cdnService.getOptimizedUrl(publicId, { width: 400, height: 300 }),
      large: cdnService.getOptimizedUrl(publicId, { width: 800, height: 600 })
    });

    next();
  };
};

module.exports = {
  cdn,
  optimizeImages,
  uploadToCDN,
  cleanupCDN,
  cdnStats,
  transformImage,
  progressiveImages
};
