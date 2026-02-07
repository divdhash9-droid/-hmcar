// [[ARABIC_HEADER]] هذا الملف (routes/cars-backup.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const crypto = require('crypto');
const Car = require('../models/Car');
const Auction = require('../models/Auction');
const VehicleCategory = require('../models/VehicleCategory');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const SiteSetting = require('../models/SiteSetting');

function toNumberOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseCustomerBanners(raw) {
  try {
    const parsed = JSON.parse(String(raw || '').trim() || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((b) => {
        if (!b) return null;
        if (typeof b === 'string') return { imageUrl: b, title: '', linkUrl: '' };
        return {
          imageUrl: b.imageUrl ? String(b.imageUrl) : '',
          title: b.title ? String(b.title) : '',
          linkUrl: b.linkUrl ? String(b.linkUrl) : ''
        };
      })
      .filter((b) => b && b.imageUrl);
  } catch (e) {
    return [];
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

router.get('/', async (req, res) => {
  if (req.session && req.session.user && req.session.user.role === 'buyer') {
    const user = req.session.user;
    const now = new Date();

    const [availableCars, myCars, ordersAll, ordersPending, liveAuctions] = await Promise.all([
      Car.countDocuments({ isSold: { $ne: true } }),
      Car.countDocuments({ isSold: true, soldTo: user._id }),
      Order.countDocuments({ buyer: user._id }),
      Order.countDocuments({ buyer: user._id, status: 'pending' }),
      Auction.countDocuments({ status: 'running' })
    ]);

    return res.render('cars/buyer-dashboard', {
      hideNavbar: true,
      fullWidth: true,
      buyerFullWidth: true,
      bodyClass: 'hm-buyer-dashboard',
      counts: { availableCars, myCars, ordersAll, ordersPending, liveAuctions }
    });
  }

  const cars = await Car.find({ isSold: { $ne: true } })
    .select('make makeLogoUrl')
    .sort({ createdAt: -1 });

  const bannersSetting = await SiteSetting.findOne({ key: 'customerBanners' });
  const customerBanners = parseCustomerBanners(bannersSetting ? bannersSetting.value : '');

  const brandMap = new Map();

  for (const c of cars) {
    const make = String(c.make || '').trim();
    if (!make) continue;
    const key = make.toLowerCase();
    const existing = brandMap.get(key);
    if (!existing) {
      brandMap.set(key, {
        make,
        logoUrl: c.makeLogoUrl ? String(c.makeLogoUrl).trim() : '',
        count: 1
      });
    } else {
      existing.count += 1;
      if (!existing.logoUrl && c.makeLogoUrl) existing.logoUrl = String(c.makeLogoUrl).trim();
    }
  }

  res.render('cars/brands', {
    brands: Array.from(brandMap.values()),
    customerBanners
  });
});

router.get('/available', requireAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      make,
      model,
      category,
      price,
      year,
      search
    } = req.query;

    const filter = { isSold: { $ne: true } };
    
    if (make) filter.make = make;
    if (model) filter.model = model;
    if (category) filter.category = category;
    if (year) filter.year = parseInt(year);
    
    if (price) {
      if (price === '0-50000') {
        filter.price = { $lt: 50000 };
      } else if (price === '50000-100000') {
        filter.price = { $gte: 50000, $lt: 100000 };
      } else if (price === '100000-200000') {
        filter.price = { $gte: 100000, $lt: 200000 };
      } else if (price === '200000+') {
        filter.price = { $gte: 200000 };
      }
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const cars = await Car.find(filter)
      .populate('make', 'name logoUrl')
      .populate('model', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(filter);

    const userId = req.session.user._id;
    const Favorite = require('../models/Favorite');
    const favoriteCarIds = await Favorite.find({ user: userId }).distinct('car');
    
    const carsWithFavorites = cars.map(car => ({
      ...car.toObject(),
      isFavorite: favoriteCarIds.includes(car._id)
    }));

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    res.render('client/cars', { 
      cars: carsWithFavorites,
      pagination,
      filters: { make, model, category, price, year, search },
      user: req.session.user,
      title: 'السيارات المتاحة - HM CAR'
    });
  } catch (error) {
    console.error('Error fetching available cars:', error);
    res.status(500).render('errors/500', { error: 'حدث خطأ أثناء تحميل السيارات' });
  }
});

router.get('/new', requireAuth, requireRole('admin'), async (req, res) => {
  const categories = await VehicleCategory.find().sort({ name: 1 });
  res.render('cars/form-luxury', { categories });
});

module.exports = router;
