// [[ARABIC_HEADER]] هذا الملف (routes/spareParts.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const SparePart = require('../models/SparePart');
const Order = require('../models/Order');
const SpareBrand = require('../models/SpareBrand');
const ExchangeRate = require('../models/ExchangeRate');
const { requireAuth } = require('../middleware/auth');

function getCart(req) {
  if (!req.session) return { items: [] };
  if (!req.session.spareCart) req.session.spareCart = { items: [] };
  if (!Array.isArray(req.session.spareCart.items)) req.session.spareCart.items = [];
  return req.session.spareCart;
}

function setCart(req, cart) {
  if (!req.session) return;
  req.session.spareCart = cart;
}

function toInt(v, fallback = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(Math.floor(n), 1);
}

async function createOrderWithRetry(orderDoc) {
  const year = new Date().getFullYear();
  const prefix = `HM-${year}-`;
  let lastErr = null;

  for (let i = 0; i < 5; i++) {
    const seq = await Order.countDocuments({ orderNumber: new RegExp('^' + prefix) });
    const orderNumber = `${prefix}${String(seq + 1 + i).padStart(6, '0')}`;
    try {
      return await Order.create({ ...orderDoc, orderNumber });
    } catch (err) {
      lastErr = err;
      if (err && err.code === 11000) continue;
      throw err;
    }
  }

  throw (lastErr || new Error('تعذر إنشاء رقم الطلب. حاول مرة أخرى.'));
}

// مسارات قطع الغيار (Spare Parts):
// - GET  /spare-parts/brands  عرض الشركات المستخرجة من قطع الغيار
// - GET  /spare-parts/meta    API للفلاتر الديناميكية (make -> models -> years)
// - GET  /spare-parts         قائمة القطع مع فلاتر بحث
// - POST /spare-parts/buy/:id شراء قطعة (إنشاء Order) ثم تحويل لصفحة الفاتورة

router.get('/brands', async (req, res) => {
  const brands = await SpareBrand.find().sort({ name: 1 });
  const ids = brands.map((b) => b._id);
  const counts = ids.length
    ? await SparePart.aggregate([
      { $match: { spareBrand: { $in: ids } } },
      { $group: { _id: '$spareBrand', count: { $sum: 1 } } }
    ])
    : [];
  const countMap = new Map(counts.map((c) => [String(c._id), Number(c.count || 0)]));

  const viewBrands = brands.map((b) => ({
    _id: b._id,
    name: b.name,
    key: b.key,
    logoUrl: b.logoUrl,
    count: countMap.get(String(b._id)) || 0
  }));

  res.render('spare-parts/brands', { brands: viewBrands });
});

router.get('/meta', async (req, res) => {
  // API صغيرة لدعم فلترة الواجهة (إرجاع makes/models/years حسب القيم المختارة)
  // تُستخدم في views/spare-parts/list.ejs عبر fetch عند تغيير خيارات الشركة/الموديل
  try {
    const make = String(req.query.make || '').trim();
    const brandKey = String(req.query.brand || '').trim();
    const model = String(req.query.model || '').trim();

    if (!brandKey && !make) {
      const brands = await SpareBrand.find().sort({ name: 1 }).select('name');
      const makes = brands.map((b) => b.name);
      return res.json({ makes, models: [], years: [] });
    }

    const effectiveKey = (brandKey || make).toLowerCase();
    const brand = await SpareBrand.findOne({ $or: [{ key: effectiveKey }, { name: new RegExp('^' + effectiveKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] });

    const makeRe = new RegExp('^' + String(make || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');

    if (!model) {
      const models = await SparePart.distinct('carModel', {
        ...(brand ? { spareBrand: brand._id } : (make ? { carMake: makeRe } : {})),
        carModel: { $nin: [null, ''] }
      });
      models.sort((a, b) => String(a).localeCompare(String(b)));
      return res.json({ makes: [], models, years: [] });
    }

    const modelRe = new RegExp('^' + model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    const years = await SparePart.distinct('carYear', {
      ...(brand ? { spareBrand: brand._id } : (make ? { carMake: makeRe } : {})),
      carModel: modelRe,
      carYear: { $ne: null }
    });
    years.sort((a, b) => Number(a) - Number(b));
    return res.json({ makes: [], models: [], years });
  } catch (e) {
    return res.json({ makes: [], models: [], years: [] });
  }
});

router.get('/', async (req, res) => {
  // صفحة قائمة قطع الغيار مع فلاتر (بحث نصي + make/model/year)
  // الفلاتر تُترجم إلى RegExp (case-insensitive) حتى نسمح بكتابة مختلفة لنفس الاسم
  const { q, make, model, year, brand } = req.query;
  const filter = {};

  if (q && String(q).trim()) {
    const query = String(q).trim();
    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { partType: re }];
  }

  const brandKey = String(brand || make || '').trim();
  if (brandKey) {
    const key = brandKey.toLowerCase();
    const b = await SpareBrand.findOne({ key });
    if (b) {
      filter.spareBrand = b._id;
    } else if (make && String(make).trim()) {
      filter.carMake = new RegExp('^' + String(make).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    }
  }

  if (model && String(model).trim()) {
    filter.carModel = new RegExp('^' + String(model).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
  }

  if (year && String(year).trim()) {
    const y = Number(year);
    if (!Number.isNaN(y)) filter.carYear = y;
  }


  const [parts, brands] = await Promise.all([
    SparePart.find(filter).sort({ createdAt: -1 }),
    SpareBrand.find().sort({ name: 1 }).select('name')
  ]);

  const makes = brands.map((b) => b.name);

  res.render('spare-parts/list', {
    parts,
    makes,
    filters: {
      q: q || '',
      make: brandKey || '',
      model: model || '',
      year: year || ''
    }
  });
});

router.get('/part/:id', async (req, res) => {
  const part = await SparePart.findById(req.params.id);
  if (!part) return res.status(404).render('errors/404');
  const cart = getCart(req);
  const existing = (cart.items || []).find((it) => String(it.partId) === String(part._id));
  const inCartQty = existing ? Number(existing.qty || 0) : 0;
  res.render('spare-parts/detail', { part, inCartQty });
});

// رابط قديم: نحوله للرابط الموحد
router.get('/list', (req, res) => {
  const qs = new URLSearchParams(req.query || {}).toString();
  return res.redirect(qs ? `/spare-parts?${qs}` : '/spare-parts');
});

router.post('/buy/:id', requireAuth, async (req, res) => {
  // شراء قطعة غيار: إنشاء Order ثم تحويل المستخدم لصفحة الفاتورة
  try {
    const user = req.session.user;
    if (!user || user.role !== 'buyer') {
      req.session.flash = { type: 'danger', message: 'عملية الشراء متاحة للعملاء فقط.' };
      return res.redirect('/auth/login');
    }

    const part = await SparePart.findById(req.params.id);
    if (!part) {
      req.session.flash = { type: 'danger', message: 'قطعة الغيار غير موجودة.' };
      return res.redirect('/spare-parts');
    }

    // منع الشراء إذا كانت القطعة غير متوفرة
    if (!part.inStock || Number(part.stockQty || 0) <= 0) {
      req.session.flash = { type: 'danger', message: 'هذه القطعة غير متوفرة حالياً.' };
      return res.redirect('/spare-parts');
    }

    const sar = (part.priceSar !== undefined && part.priceSar !== null) ? part.priceSar : null;
    const usd = (part.priceUsd !== undefined && part.priceUsd !== null) ? part.priceUsd : null;
    const legacy = (part.price !== undefined && part.price !== null) ? part.price : null;

    const unitSar = sar !== null ? sar : (legacy !== null ? legacy : null);
    const unitUsd = usd !== null ? usd : null;

    const order = await createOrderWithRetry({
      buyer: user._id,
      items: [{
        itemType: 'sparePart',
        refId: part._id,
        titleSnapshot: part.name,
        qty: 1,
        unitPriceSar: unitSar,
        unitPriceUsd: unitUsd
      }],
      pricing: {
        subTotalSar: unitSar || 0,
        subTotalUsd: unitUsd || 0,
        shippingSar: 0,
        shippingUsd: 0,
        grandTotalSar: unitSar || 0,
        grandTotalUsd: unitUsd || 0
      }
    });

    return res.redirect(`/orders/${order._id}/invoice`);
  } catch (e) {
    req.session.flash = { type: 'danger', message: 'تعذر إنشاء طلب الشراء. حاول مرة أخرى.' };
    return res.redirect('/spare-parts');
  }
});

router.get('/cart', requireAuth, async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'buyer') return res.redirect('/cars');

  const cart = getCart(req);
  const items = Array.isArray(cart.items) ? cart.items : [];
  const ids = items.map((it) => it.partId).filter(Boolean);
  const parts = ids.length ? await SparePart.find({ _id: { $in: ids } }) : [];
  const partMap = new Map(parts.map((p) => [String(p._id), p]));

  const enriched = items.map((it) => {
    const p = partMap.get(String(it.partId));
    return { part: p || null, qty: Math.max(Number(it.qty || 1), 1) };
  }).filter((x) => x.part);

  res.render('spare-parts/cart', { items: enriched });
});

router.post('/cart/add/:id', requireAuth, async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'buyer') return res.redirect('/auth/login');

  const part = await SparePart.findById(req.params.id);
  if (!part) {
    req.session.flash = { type: 'danger', message: 'قطعة الغيار غير موجودة.' };
    return res.redirect('/spare-parts');
  }

  const qty = toInt(req.body.qty || 1, 1);
  const cart = getCart(req);
  const items = Array.isArray(cart.items) ? cart.items : [];
  const idx = items.findIndex((it) => String(it.partId) === String(part._id));
  if (idx >= 0) {
    items[idx].qty = Math.max(Number(items[idx].qty || 1) + qty, 1);
  } else {
    items.push({ partId: String(part._id), qty });
  }
  cart.items = items;
  cart.updatedAt = new Date().toISOString();
  setCart(req, cart);

  const back = req.get('referer') || `/spare-parts/part/${part._id}`;
  return res.redirect(back);
});

router.post('/cart/remove/:id', requireAuth, async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'buyer') return res.redirect('/cars');

  const cart = getCart(req);
  cart.items = (Array.isArray(cart.items) ? cart.items : []).filter((it) => String(it.partId) !== String(req.params.id));
  cart.updatedAt = new Date().toISOString();
  setCart(req, cart);

  return res.redirect('/spare-parts/cart');
});

router.post('/cart/update/:id', requireAuth, async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'buyer') return res.redirect('/cars');

  const qty = toInt(req.body.qty || 1, 1);
  const cart = getCart(req);
  const items = Array.isArray(cart.items) ? cart.items : [];
  const idx = items.findIndex((it) => String(it.partId) === String(req.params.id));
  if (idx >= 0) items[idx].qty = qty;
  cart.items = items;
  cart.updatedAt = new Date().toISOString();
  setCart(req, cart);
  return res.redirect('/spare-parts/cart');
});

router.post('/cart/checkout', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    if (!user || user.role !== 'buyer') return res.redirect('/auth/login');

    const cart = getCart(req);
    const items = Array.isArray(cart.items) ? cart.items : [];
    if (!items.length) {
      req.session.flash = { type: 'danger', message: 'السلة فارغة.' };
      return res.redirect('/spare-parts/cart');
    }

    const ids = items.map((it) => it.partId).filter(Boolean);
    const parts = await SparePart.find({ _id: { $in: ids } });
    const partMap = new Map(parts.map((p) => [String(p._id), p]));

    const orderItems = [];
    let subTotalSar = 0;
    let subTotalUsd = 0;

    for (const it of items) {
      const part = partMap.get(String(it.partId));
      if (!part) continue;

      const qty = Math.max(Number(it.qty || 1), 1);
      if (!part.inStock || Number(part.stockQty || 0) <= 0) continue;

      const sar = (part.priceSar !== undefined && part.priceSar !== null) ? part.priceSar : null;
      const usd = (part.priceUsd !== undefined && part.priceUsd !== null) ? part.priceUsd : null;
      const legacy = (part.price !== undefined && part.price !== null) ? part.price : null;
      const unitSar = sar !== null ? sar : (legacy !== null ? legacy : null);
      const unitUsd = usd !== null ? usd : null;

      orderItems.push({
        itemType: 'sparePart',
        refId: part._id,
        titleSnapshot: part.name,
        qty,
        unitPriceSar: unitSar,
        unitPriceUsd: unitUsd
      });

      if (unitSar !== null && unitSar !== undefined) subTotalSar += Number(unitSar) * qty;
      if (unitUsd !== null && unitUsd !== undefined) subTotalUsd += Number(unitUsd) * qty;
    }

    if (!orderItems.length) {
      req.session.flash = { type: 'danger', message: 'لا توجد قطع متوفرة لإتمام الطلب.' };
      return res.redirect('/spare-parts/cart');
    }

    const order = await createOrderWithRetry({
      buyer: user._id,
      items: orderItems,
      pricing: {
        subTotalSar,
        subTotalUsd,
        shippingSar: 0,
        shippingUsd: 0,
        grandTotalSar: subTotalSar,
        grandTotalUsd: subTotalUsd
      }
    });

    setCart(req, { items: [], updatedAt: new Date().toISOString() });

    const autoWhatsApp = String(req.query.autoWhatsApp || '').trim() === '1';
    return res.redirect(autoWhatsApp ? `/orders/${order._id}/invoice?openWhatsApp=1` : `/orders/${order._id}/invoice`);
  } catch (e) {
    if (req.session) req.session.flash = { type: 'danger', message: 'تعذر إنشاء الطلب من السلة. حاول مرة أخرى.' };
    return res.redirect('/spare-parts/cart');
  }
});

module.exports = router;
