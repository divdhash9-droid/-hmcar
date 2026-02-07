// [[ARABIC_HEADER]] هذا الملف (routes/sitemap.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// routes/sitemap.js - Dynamic Sitemap Generator
const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const Auction = require('../models/Auction');

// Generate XML Sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    
    // Static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/cars', changefreq: 'daily', priority: 0.9 },
      { url: '/auctions', changefreq: 'daily', priority: 0.9 },
      { url: '/auctions/live', changefreq: 'hourly', priority: 0.8 },
      { url: '/about', changefreq: 'monthly', priority: 0.5 },
      { url: '/contact', changefreq: 'monthly', priority: 0.5 },
      { url: '/auth/login', changefreq: 'monthly', priority: 0.3 }
    ];
    
    // Dynamic pages - Cars
    const cars = await Car.find({ isSold: false })
      .select('_id updatedAt')
      .sort({ createdAt: -1 })
      .limit(1000);
    
    const carPages = cars.map(car => ({
      url: `/cars/${car._id}`,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: car.updatedAt
    }));
    
    // Dynamic pages - Auctions
    const auctions = await Auction.find({ status: { $in: ['active', 'scheduled'] } })
      .select('_id updatedAt')
      .sort({ createdAt: -1 })
      .limit(500);
    
    const auctionPages = auctions.map(auction => ({
      url: `/auctions/${auction._id}`,
      changefreq: 'hourly',
      priority: 0.8,
      lastmod: auction.updatedAt
    }));
    
    // Combine all pages
    const allPages = [...staticPages, ...carPages, ...auctionPages];
    
    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    allPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      if (page.lastmod) {
        xml += `    <lastmod>${new Date(page.lastmod).toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  
  const robotsTxt = `# HM CAR - Robots.txt
User-agent: *
Allow: /
Allow: /cars
Allow: /auctions
Allow: /public/

Disallow: /admin
Disallow: /api/
Disallow: /auth/
Disallow: /orders/

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for specific bots
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
`;
  
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

module.exports = router;
