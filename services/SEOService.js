// [[ARABIC_HEADER]] هذا الملف (services/SEOService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * SEOService - خدمة تحسين محركات البحث
 * مسؤولة عن توليد الـ Meta Tags و الـ Schema.org لضمان أفضل ظهور في نتائج بحث Google.
 */
class SEOService {
  /**
   * توليد وسوم الميتا الأساسية (Meta Tags)
   */
  static generateMetaTags(data) {
    const {
      title,
      description,
      keywords,
      image,
      url,
      type = 'website',
      siteName = 'HM CAR',
      locale = 'ar_SA'
    } = data;

    // تنظيف وتحسين العنوان والوصف لجذب محركات البحث
    const cleanTitle = this.truncate(title, 60);
    const cleanDescription = this.truncate(description, 160);

    return {
      // الـ Meta Tags الأساسية
      title: cleanTitle,
      description: cleanDescription,
      keywords: keywords ? keywords.join(', ') : 'سيارات كورية, مزادات سيارات, استيراد سيارات, HM CAR',
      
      // Open Graph (Facebook/WhatsApp/Telegram)
      'og:title': cleanTitle,
      'og:description': cleanDescription,
      'og:image': image || `${process.env.BASE_URL}/public/images/og-default.png`,
      'og:url': url,
      'og:type': type,
      'og:site_name': siteName,
      'og:locale': locale,
      
      // Twitter Card
      'twitter:card': 'summary_large_image',
      'twitter:title': cleanTitle,
      'twitter:description': cleanDescription,
      'twitter:image': image || `${process.env.BASE_URL}/public/images/og-default.png`,
      
      'robots': 'index, follow',
      'googlebot': 'index, follow, max-snippet:-1, max-image-preview:large',
      'canonical': url,
    };
  }

  /**
   * توليد البيانات المنظمة (Structured Data / JSON-LD)
   * تساعد جوجل على عرض السيارة بشكل احترافي في نتائج البحث.
   */
  static generateStructuredData(data) {
    const { type, title, description, image, url } = data;

    let schema = {
      '@context': 'https://schema.org',
    };

    switch (type) {
      case 'car':
        schema = {
          ...schema,
          '@type': 'Car',
          'name': title,
          'description': description,
          'image': image,
          'url': url,
          'brand': {
            '@type': 'Brand',
            'name': data.brand
          },
          'modelDate': data.year,
          'vehicleCondition': `https://schema.org/${data.condition === 'new' ? 'NewCondition' : 'UsedCondition'}`,
          'offers': {
            '@type': 'Offer',
            'price': data.price,
            'priceCurrency': 'SAR',
            'availability': 'https://schema.org/InStock',
            'seller': {
              '@type': 'Organization',
              'name': 'HM CAR'
            }
          }
        };
        break;

      case 'auction':
        schema = {
          ...schema,
          '@type': 'Event',
          'name': `مزاد سيارات: ${title}`,
          'description': description,
          'image': image,
          'startDate': data.startTime,
          'eventStatus': 'https://schema.org/EventScheduled',
          'eventAttendanceMode': 'https://schema.org/OnlineEventAttendanceMode',
          'location': {
            '@type': 'VirtualLocation',
            'url': url
          }
        };
        break;

      default:
        schema = {
          ...schema,
          '@type': 'WebSite',
          'name': 'HM CAR',
          'url': process.env.BASE_URL
        };
    }

    return JSON.stringify(schema);
  }

  /**
   * تحسين أرشفة صفحة السيارة الفردية
   */
  static generateCarSEO(car) {
    const title = `شراء ${car.title} ${car.year} | فحص كامل وحالة ممتازة | HM CAR`;
    const description = `فرصة في HM CAR: ${car.title} موديل ${car.year}. السعر: ${car.price} ريال. فحص معتمد وشحن سريع وشامل لكل دول الخليج.`;
    
    const url = `${process.env.BASE_URL}/cars/${car._id}`;
    const image = car.images?.[0] || `${process.env.BASE_URL}/public/images/default-car.png`;

    return {
      meta: this.generateMetaTags({
        title,
        description,
        image,
        url,
        type: 'product',
        brand: car.brand?.name,
        price: car.price
      }),
      schema: this.generateStructuredData({
        type: 'car',
        title,
        description,
        image,
        url,
        brand: car.brand?.name,
        year: car.year,
        price: car.price,
        condition: car.condition
      })
    };
  }

  /**
   * توليد خريطة الموقع (Sitemap) بشكل ديناميكي
   */
  static generateSitemapXML(items) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    const addUrl = (loc, priority = '0.5', freq = 'weekly') => {
      xml += '  <url>\n';
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <changefreq>${freq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += '  </url>\n';
    };

    addUrl(process.env.BASE_URL, '1.0', 'daily');

    items.cars?.forEach(c => addUrl(`${process.env.BASE_URL}/cars/${c._id}`, '0.8'));
    items.auctions?.forEach(a => addUrl(`${process.env.BASE_URL}/auctions/${a._id}`, '0.9', 'daily'));

    xml += '</urlset>';
    return xml;
  }

  static truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length).trim() + '...' : str;
  }
}

module.exports = SEOService;
