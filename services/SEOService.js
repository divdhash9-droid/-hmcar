// [[ARABIC_HEADER]] هذا الملف (services/SEOService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

class SEOService {
  static generateMetaTags(data) {
    const {
      title,
      description,
      keywords,
      image,
      url,
      type = 'website',
      siteName = 'HM CAR',
      locale = 'ar_SA',
      author,
      publishedTime,
      modifiedTime,
      section,
      tags
    } = data;

    const metaTags = {
      // Basic meta tags
      title: this.truncate(title, 60),
      description: this.truncate(description, 160),
      keywords: keywords ? keywords.join(', ') : '',
      
      // Open Graph tags
      'og:title': this.truncate(title, 60),
      'og:description': this.truncate(description, 160),
      'og:image': image || '/public/images/logo.png',
      'og:url': url,
      'og:type': type,
      'og:site_name': siteName,
      'og:locale': locale,
      
      // Twitter Card tags
      'twitter:card': 'summary_large_image',
      'twitter:title': this.truncate(title, 60),
      'twitter:description': this.truncate(description, 160),
      'twitter:image': image || '/public/images/logo.png',
      'twitter:site': '@hmcar',
      'twitter:creator': author || '@hmcar',
      
      // Article specific tags (if type is article)
      ...(type === 'article' && {
        'article:author': author,
        'article:published_time': publishedTime,
        'article:modified_time': modifiedTime,
        'article:section': section,
        'article:tag': tags || []
      }),
      
      // Product specific tags (if type is product)
      ...(type === 'product' && {
        'product:brand': data.brand,
        'product:price:amount': data.price,
        'product:price:currency': data.currency || 'SAR',
        'product:availability': data.availability || 'in stock',
        'product:condition': data.condition || 'new'
      }),
      
      // Additional SEO tags
      'robots': 'index, follow',
      'googlebot': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      'author': author || 'HM CAR',
      'publisher': siteName,
      'canonical': url,
      
      // Technical tags
      'language': locale,
      'geo.region': 'SA',
      'geo.placename': 'Saudi Arabia',
      'ICBM': '23.8859,45.0792', // Saudi Arabia coordinates
      'rating': 'general',
      'distribution': 'global',
      
      // Schema.org structured data
      'json-ld': this.generateStructuredData(data)
    };

    return metaTags;
  }

  static generateStructuredData(data) {
    const { type, title, description, image, url, price, brand, availability } = data;

    let structuredData;

    switch (type) {
      case 'product':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: title,
          description: description,
          image: image,
          url: url,
          brand: {
            '@type': 'Brand',
            name: brand
          },
          offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'SAR',
            availability: `https://schema.org/${availability || 'InStock'}`,
            seller: {
              '@type': 'Organization',
              name: 'HM CAR'
            }
          }
        };
        break;

      case 'article':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: description,
          image: image,
          url: url,
          author: {
            '@type': 'Organization',
            name: 'HM CAR'
          },
          publisher: {
            '@type': 'Organization',
            name: 'HM CAR',
            logo: {
              '@type': 'ImageObject',
              url: '/public/images/logo.png'
            }
          },
          datePublished: data.publishedTime,
          dateModified: data.modifiedTime
        };
        break;

      case 'website':
      default:
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'HM CAR',
          description: description,
          url: url,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${url}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };
        break;
    }

    return JSON.stringify(structuredData);
  }

  static generateCarSEO(car) {
    const title = `${car.title} - ${car.brand?.name || ''} - ${car.year || ''} | HM CAR`;
    const description = `اشترِ ${car.title} ${car.year} من ${car.brand?.name || ''} بسعر ${car.price} ريال. ${car.description?.substring(0, 100) || ''}`;
    const keywords = [
      car.title,
      car.brand?.name,
      car.model,
      car.year?.toString(),
      'سيارات مستعملة',
      'سيارات للبيع',
      'شراء سيارة',
      'سيارات كورية',
      'HM CAR',
      car.condition
    ].filter(Boolean);

    return this.generateMetaTags({
      title,
      description,
      keywords,
      image: car.images?.[0] || '/public/images/logo.png',
      url: `${process.env.BASE_URL}/cars/${car._id}`,
      type: 'product',
      brand: car.brand?.name,
      price: car.price,
      availability: car.available ? 'in stock' : 'out of stock',
      condition: car.condition,
      section: 'cars'
    });
  }

  static generateAuctionSEO(auction) {
    const title = `مزاد ${auction.title} - ${auction.brand?.name || ''} | HM CAR`;
    const description = `شارك في مزاد ${auction.title} من ${auction.brand?.name || ''} بسعر ابتدائي ${auction.startingPrice} ريال. ${auction.description?.substring(0, 100) || ''}`;
    const keywords = [
      'مزاد',
      'مزادات سيارات',
      auction.title,
      auction.brand?.name,
      'شراء سيارة بالمزاد',
      'سيارات مزاد',
      'HM CAR'
    ].filter(Boolean);

    return this.generateMetaTags({
      title,
      description,
      keywords,
      image: auction.images?.[0] || '/public/images/logo.png',
      url: `${process.env.BASE_URL}/auctions/${auction._id}`,
      type: 'product',
      brand: auction.brand?.name,
      price: auction.startingPrice,
      availability: auction.status === 'active' ? 'in stock' : 'out of stock',
      section: 'auctions',
      publishedTime: auction.createdAt,
      modifiedTime: auction.updatedAt
    });
  }

  static generateSparePartSEO(part) {
    const title = `${part.title} - قطعة غيار ${part.brand?.name || ''} | HM CAR`;
    const description = `اشترِ قطعة غيار ${part.title} لسيارات ${part.brand?.name || ''} بسعر ${part.price} ريال. ${part.description?.substring(0, 100) || ''}`;
    const keywords = [
      part.title,
      part.brand?.name,
      'قطع غيار',
      'قطع غيار سيارات',
      'قطع غيار كورية',
      'شراء قطع غيار',
      'HM CAR',
      part.category
    ].filter(Boolean);

    return this.generateMetaTags({
      title,
      description,
      keywords,
      image: part.images?.[0] || '/public/images/logo.png',
      url: `${process.env.BASE_URL}/spare-parts/${part._id}`,
      type: 'product',
      brand: part.brand?.name,
      price: part.price,
      availability: part.available ? 'in stock' : 'out of stock',
      section: 'spare-parts'
    });
  }

  static generateSearchSEO(query, results) {
    const title = `نتائج البحث عن "${query}" | HM CAR`;
    const description = `ابحث عن سيارات وقطع غيار كورية. ${results.length} نتيجة لبحثك عن "${query}".`;
    const keywords = [
      query,
      'بحث سيارات',
      'بحث قطع غيار',
      'سيارات كورية',
      'HM CAR'
    ];

    return this.generateMetaTags({
      title,
      description,
      keywords,
      url: `${process.env.BASE_URL}/search?q=${encodeURIComponent(query)}`,
      type: 'website',
      section: 'search'
    });
  }

  static generateCategorySEO(category, items) {
    const title = `${category} | HM CAR`;
    const description = `استعرض جميع ${category} المتوفرة. ${items.length} ${category} متاحة للشراء الآن.`;
    const keywords = [
      category,
      'سيارات',
      'قطع غيار',
      'شراء سيارة',
      'HM CAR'
    ];

    return this.generateMetaTags({
      title,
      description,
      keywords,
      url: `${process.env.BASE_URL}/category/${category}`,
      type: 'website',
      section: 'category'
    });
  }

  static generateBrandSEO(brand, cars) {
    const title = `سيارات ${brand.name} | HM CAR`;
    const description = `استعرض جميع سيارات ${brand.name} المتوفرة. ${cars.length} سيارة ${brand.name} متاحة للشراء الآن.`;
    const keywords = [
      brand.name,
      `سيارات ${brand.name}`,
      `${brand.name} للبيع`,
      `${brand.name} كورية`,
      'HM CAR'
    ];

    return this.generateMetaTags({
      title,
      description,
      keywords,
      image: brand.logo || '/public/images/logo.png',
      url: `${process.env.BASE_URL}/brands/${brand._id}`,
      type: 'website',
      section: 'brand'
    });
  }

  static generateHomePageSEO() {
    const title = 'HM CAR - سيارات كورية للبيع | مزادات سيارات | قطع غيار';
    const description = 'HM CAR - أفضل منصة لشراء وبيع السيارات الكورية المستعملة. مزادات مباشرة، قطع غيار أصلية، خدمة توصيل لجميع دول الخليج.';
    const keywords = [
      'سيارات كورية',
      'سيارات مستعملة',
      'شراء سيارة',
      'مزادات سيارات',
      'قطع غيار',
      'سيارات كورية للبيع',
      'HM CAR',
      'سيارات كوريا',
      'تصدير سيارات'
    ];

    return this.generateMetaTags({
      title,
      description,
      keywords,
      image: '/public/images/logo.png',
      url: process.env.BASE_URL,
      type: 'website',
      section: 'home'
    });
  }

  static generateSitemapXML(items) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${process.env.BASE_URL}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += '  </url>\n';

    // Add cars
    items.cars?.forEach(car => {
      xml += '  <url>\n';
      xml += `    <loc>${process.env.BASE_URL}/cars/${car._id}</loc>\n`;
      xml += `    <lastmod>${car.updatedAt || car.createdAt}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    });

    // Add auctions
    items.auctions?.forEach(auction => {
      xml += '  <url>\n';
      xml += `    <loc>${process.env.BASE_URL}/auctions/${auction._id}</loc>\n`;
      xml += `    <lastmod>${auction.updatedAt || auction.createdAt}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += '  </url>\n';
    });

    // Add spare parts
    items.spareParts?.forEach(part => {
      xml += '  <url>\n';
      xml += `    <loc>${process.env.BASE_URL}/spare-parts/${part._id}</loc>\n`;
      xml += `    <lastmod>${part.updatedAt || part.createdAt}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  static generateRobotsTxt() {
    let robots = 'User-agent: *\n';
    robots += 'Allow: /\n';
    robots += 'Disallow: /auth/\n';
    robots += 'Disallow: /admin/\n';
    robots += 'Disallow: /api/\n';
    robots += 'Disallow: /private/\n';
    robots += 'Disallow: /uploads/\n';
    robots += 'Disallow: /*.json$\n';
    robots += 'Disallow: /*?*\n';
    robots += 'Allow: /*.html$\n';
    robots += 'Allow: /*?page=\n';
    robots += '\n';
    robots += 'Sitemap: ' + process.env.BASE_URL + '/sitemap.xml\n';
    
    return robots;
  }

  // Helper methods
  static truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  static generateCanonicalUrl(path) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    return baseUrl + path;
  }

  static generateBreadcrumbs(items) {
    const breadcrumbs = [
      {
        name: 'الرئيسية',
        url: '/'
      },
      ...items.map(item => ({
        name: item.name,
        url: item.url
      }))
    ];

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    };

    return {
      items: breadcrumbs,
      structuredData: JSON.stringify(structuredData)
    };
  }
}

module.exports = SEOService;
