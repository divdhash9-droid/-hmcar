// [[ARABIC_HEADER]] هذا الملف (middleware/seo.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const SEOService = require('../services/SEOService');

// SEO middleware for dynamic meta tags
const seo = (options = {}) => {
  return (req, res, next) => {
    // Generate SEO data based on route and data
    const seoData = generateSEOData(req, res, options);
    
    // Make SEO data available in templates
    res.locals.seo = seoData;
    
    next();
  };
};

// Generate SEO data based on request
function generateSEOData(req, res, options) {
  const path = req.path;
  const query = req.query;
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  const fullUrl = baseUrl + req.originalUrl;

  let seoData = {
    title: 'HM CAR - سيارات كورية للبيع',
    description: 'HM CAR - أفضل منصة لشراء وبيع السيارات الكورية المستعملة',
    keywords: ['سيارات كورية', 'سيارات مستعملة', 'شراء سيارة', 'HM CAR'],
    image: '/public/images/logo.png',
    url: fullUrl,
    canonical: fullUrl,
    type: 'website',
    structuredData: null,
    breadcrumbs: null
  };

  // Route-specific SEO
  if (path === '/' || path === '/cars') {
    seoData = { ...seoData, ...SEOService.generateHomePageSEO() };
  } else if (path.startsWith('/cars/') && req.car) {
    seoData = { ...seoData, ...SEOService.generateCarSEO(req.car) };
  } else if (path.startsWith('/auctions/') && req.auction) {
    seoData = { ...seoData, ...SEOService.generateAuctionSEO(req.auction) };
  } else if (path.startsWith('/spare-parts/') && req.sparePart) {
    seoData = { ...seoData, ...SEOService.generateSparePartSEO(req.sparePart) };
  } else if (path.startsWith('/search') && query.q) {
    seoData = { ...seoData, ...SEOService.generateSearchSEO(query.q, req.searchResults || []) };
  } else if (path.startsWith('/brands/') && req.brand) {
    seoData = { ...seoData, ...SEOService.generateBrandSEO(req.brand, req.cars || []) };
  } else if (path.startsWith('/category/') && req.category) {
    seoData = { ...seoData, ...SEOService.generateCategorySEO(req.category, req.items || []) };
  }

  // Generate breadcrumbs
  seoData.breadcrumbs = generateBreadcrumbs(path, req);

  return seoData;
}

// Generate breadcrumbs for current page
function generateBreadcrumbs(path, req) {
  const breadcrumbs = [];
  const pathParts = path.split('/').filter(Boolean);

  let currentPath = '';
  
  pathParts.forEach((part, index) => {
    currentPath += '/' + part;
    
    let name = '';
    let url = currentPath;
    
    // Generate breadcrumb name based on path part
    switch (part) {
      case 'cars':
        name = 'السيارات';
        break;
      case 'auctions':
        name = 'المزادات';
        break;
      case 'spare-parts':
        name = 'قطع الغيار';
        break;
      case 'brands':
        name = 'الماركات';
        break;
      case 'search':
        name = 'البحث';
        break;
      case 'about':
        name = 'من نحن';
        break;
      case 'contact':
        name = 'اتصل بنا';
        break;
      case 'support':
        name = 'الدعم';
        break;
      default:
        // Try to get item name from request data
        if (req.car && part === req.car._id.toString()) {
          name = req.car.title;
        } else if (req.auction && part === req.auction._id.toString()) {
          name = req.auction.title;
        } else if (req.sparePart && part === req.sparePart._id.toString()) {
          name = req.sparePart.title;
        } else if (req.brand && part === req.brand._id.toString()) {
          name = req.brand.name;
        } else {
          name = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    
    if (name) {
      breadcrumbs.push({ name, url });
    }
  });

  return SEOService.generateBreadcrumbs(breadcrumbs);
}

// Sitemap generation middleware
const sitemap = async (req, res) => {
  try {
    const Car = require('../models/Car');
    const Auction = require('../models/Auction');
    const SparePart = require('../models/SparePart');

    // Get all items for sitemap
    const [cars, auctions, spareParts] = await Promise.all([
      Car.find({ available: true }).select('_id updatedAt createdAt'),
      Auction.find({ status: 'active' }).select('_id updatedAt createdAt'),
      SparePart.find({ available: true }).select('_id updatedAt createdAt')
    ]);

    const sitemapData = {
      cars: cars.map(car => ({
        _id: car._id,
        updatedAt: car.updatedAt || car.createdAt
      })),
      auctions: auctions.map(auction => ({
        _id: auction._id,
        updatedAt: auction.updatedAt || auction.createdAt
      })),
      spareParts: spareParts.map(part => ({
        _id: part._id,
        updatedAt: part.updatedAt || part.createdAt
      }))
    };

    const sitemapXML = SEOService.generateSitemapXML(sitemapData);
    
    res.header('Content-Type', 'application/xml');
    res.send(sitemapXML);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

// Robots.txt middleware
const robots = (req, res) => {
  const robotsTxt = SEOService.generateRobotsTxt();
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
};

// Schema.org structured data middleware
const structuredData = (type) => {
  return (req, res, next) => {
    let structuredData = null;

    switch (type) {
      case 'website':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'HM CAR',
          url: process.env.BASE_URL,
          description: 'أفضل منصة لشراء وبيع السيارات الكورية المستعملة',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${process.env.BASE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };
        break;
      
      case 'organization':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'HM CAR',
          url: process.env.BASE_URL,
          logo: `${process.env.BASE_URL}/public/images/logo.png`,
          description: 'أفضل منصة لشراء وبيع السيارات الكورية المستعملة',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'SA',
            addressLocality: 'Riyadh'
          },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+966500000000',
            contactType: 'customer service'
          }
        };
        break;
      
      case 'localbusiness':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'HM CAR',
          url: process.env.BASE_URL,
          logo: `${process.env.BASE_URL}/public/images/logo.png`,
          description: 'أفضل منصة لشراء وبيع السيارات الكورية المستعملة',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'SA',
            addressLocality: 'Riyadh',
            streetAddress: 'Riyadh, Saudi Arabia'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 24.7136,
            longitude: 46.6753
          },
          openingHours: 'Mo-Su 00:00-23:59',
          telephone: '+966500000000'
        };
        break;
    }

    res.locals.structuredData = structuredData;
    next();
  };
};

// Open Graph image middleware
const ogImage = (defaultImage = '/public/images/logo.png') => {
  return (req, res, next) => {
    // Set default OG image
    res.locals.ogImage = defaultImage;
    
    // Override with specific image if available
    if (req.car && req.car.images && req.car.images.length > 0) {
      res.locals.ogImage = req.car.images[0];
    } else if (req.auction && req.auction.images && req.auction.images.length > 0) {
      res.locals.ogImage = req.auction.images[0];
    } else if (req.sparePart && req.sparePart.images && req.sparePart.images.length > 0) {
      res.locals.ogImage = req.sparePart.images[0];
    }
    
    next();
  };
};

// SEO validation middleware
const validateSEO = (req, res, next) => {
  // Check for missing SEO data
  const seo = res.locals.seo || {};
  
  if (!seo.title || seo.title.length > 60) {
    console.warn('SEO Warning: Title is missing or too long');
  }
  
  if (!seo.description || seo.description.length > 160) {
    console.warn('SEO Warning: Description is missing or too long');
  }
  
  if (!seo.canonical) {
    console.warn('SEO Warning: Canonical URL is missing');
  }
  
  next();
};

// SEO headers middleware
const seoHeaders = (req, res, next) => {
  const seo = res.locals.seo || {};
  
  // Set SEO headers
  if (seo.canonical) {
    res.set('Link', `<${seo.canonical}>; rel="canonical"`);
  }
  
  // Set language and region headers
  res.set('Content-Language', 'ar-SA');
  res.set('X-Content-Language', 'ar-SA');
  
  next();
};

module.exports = {
  seo,
  sitemap,
  robots,
  structuredData,
  ogImage,
  validateSEO,
  seoHeaders
};
