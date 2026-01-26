// [[ARABIC_HEADER]] هذا الملف (routes/api/cars.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
// API خفيف لدعم صفحة views/client/cars.ejs (السيارات المتاحة) التي تعتمد على /api/cars/*

const express = require('express');
const router = express.Router();
const Car = require('../../models/Car');
const VehicleCategory = require('../../models/VehicleCategory');
const Favorite = require('../../models/Favorite');

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function safeRegexFromText(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  return new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// GET /api/cars/makes
router.get('/makes', async (req, res) => {
  try {
    const makes = await Car.distinct('make', { isSold: { $ne: true }, isActive: { $ne: false } });
    const cleaned = (makes || []).map(m => String(m || '').trim()).filter(Boolean);
    cleaned.sort((a, b) => a.localeCompare(b));

    // الواجهة تتوقع { _id, name }
    return res.json({ makes: cleaned.map(name => ({ _id: name, name })) });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_load_makes' });
  }
});

// GET /api/cars/models?make=<makeName>
router.get('/models', async (req, res) => {
  try {
    const make = String(req.query.make || '').trim();
    const filter = { isSold: { $ne: true }, isActive: { $ne: false } };
    if (make) filter.make = make;

    const models = await Car.distinct('model', filter);
    const cleaned = (models || []).map(m => String(m || '').trim()).filter(Boolean);
    cleaned.sort((a, b) => a.localeCompare(b));

    return res.json({ models: cleaned.map(name => ({ _id: name, name })) });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_load_models' });
  }
});

// GET /api/cars/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await VehicleCategory.find().sort({ name: 1 }).select('name').lean();
    return res.json({ categories: categories || [] });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_load_categories' });
  }
});

// GET /api/cars?page&limit&make&model&category&price&year
router.get('/', async (req, res) => {
  try {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(req.query.limit, 12), 1), 48);
    const skip = (page - 1) * limit;

    const filter = { isSold: { $ne: true }, isActive: { $ne: false } };

    const make = String(req.query.make || '').trim();
    const model = String(req.query.model || '').trim();
    const category = String(req.query.category || '').trim();
    const year = String(req.query.year || '').trim();
    const price = String(req.query.price || '').trim();

    if (make) filter.make = make;
    if (model) filter.model = model;
    if (category) filter.category = category;
    if (year) {
      const y = Number(year);
      if (Number.isFinite(y)) filter.year = y;
    }

    if (price) {
      if (price === '0-50000') filter.price = { $lt: 50000 };
      else if (price === '50000-100000') filter.price = { $gte: 50000, $lt: 100000 };
      else if (price === '100000-200000') filter.price = { $gte: 100000, $lt: 200000 };
      else if (price === '200000+') filter.price = { $gte: 200000 };
    }

    // دعم بحث بسيط إن وجد (ضمن views/client/cars.ejs حالياً غير موجود، لكن مفيد)
    const search = safeRegexFromText(req.query.search);
    if (search) {
      filter.$or = [{ title: search }, { make: search }, { model: search }, { description: search }];
    }

    const userId = req.session?.user?._id;

    const [cars, total, favIds] = await Promise.all([
      Car.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .lean(),
      Car.countDocuments(filter),
      userId ? Favorite.find({ user: userId }).distinct('car') : []
    ]);

    const favSet = new Set((favIds || []).map(String));

    const normalizedCars = (cars || []).map(c => {
      const makeName = String(c.make || '').trim();
      const modelName = String(c.model || '').trim();
      return {
        ...c,
        make: makeName ? { _id: makeName, name: makeName } : null,
        model: modelName ? { _id: modelName, name: modelName } : null,
        price: c.priceSar ?? c.price ?? 0,
        auctionStatus: (c.listingType === 'auction') ? 'active' : 'available',
        isFavorite: favSet.has(String(c._id))
      };
    });

    return res.json({
      cars: normalizedCars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error('API /api/cars error:', e);
    return res.status(500).json({ error: 'failed_to_load_cars' });
  }
});

module.exports = router;
