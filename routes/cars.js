// [[ARABIC_HEADER]] هذا الملف (routes/cars.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// routes/cars.js
// مسارات السيارات (Cars):
// - صفحة الشركات (brands) + البنرات
// - قائمة السيارات مع فلاتر وترقيم
// - إنشاء سيارة جديدة (admin) مع رفع صور
// - شراء سيارة (buyer) -> إنشاء طلب + توكن تأكيد بيع
// - تأكيد البيع (admin)
// - ربط السيارة بمزاد (redirect)
// - إشعار اختيار سيارة (admin)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const mongoose = require('mongoose');

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const Car = require('../models/Car');
const Auction = require('../models/Auction');
const VehicleCategory = require('../models/VehicleCategory');
const Order = require('../models/Order');
const SiteSetting = require('../models/SiteSetting');
// Firebase completely removed - using local storage only
// const { bucket } = require('../config/firebase');
const { saveMulterFileToUploads } = require('../utils/uploadStorage');

function toNumberOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

// دالة مساعدة لرفع الملفات محلياً داخل uploads/ (تم إزالة Firebase)
async function uploadToFirebase(file, folder = 'cars') {
  return saveMulterFileToUploads(file, folder);
}

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

  return renderCarsList(req, res);
});

router.get('/brands', async (req, res) => {
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

  return res.render('cars/brands', {
    brands: Array.from(brandMap.values()),
    customerBanners
  });
});

// Main cars page - redirect to list

// Route removed: duplicate GET / handler


router.get('/list', async (req, res) => {
  // صفحة قائمة السيارات: فلاتر + ترقيم
  const {
    q,
    make,
    model,
    year,
    minPrice,
    maxPrice,
    page
  } = req.query;

  const filter = { isSold: { $ne: true } };

  if (q && String(q).trim()) {
    const query = String(q).trim();
    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: re }, { make: re }, { model: re }];
  }

  if (make && String(make).trim()) {
    filter.make = new RegExp(String(make).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  if (model && String(model).trim()) {
    filter.model = new RegExp(String(model).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  if (year && String(year).trim()) {
    const y = Number(year);
    if (!Number.isNaN(y)) filter.year = y;
  }

  if ((minPrice && String(minPrice).trim()) || (maxPrice && String(maxPrice).trim())) {
    filter.price = {};
    if (minPrice && String(minPrice).trim()) {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) filter.price.$gte = min;
    }
    if (maxPrice && String(maxPrice).trim()) {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) filter.price.$lte = max;
    }
    if (Object.keys(filter.price).length === 0) delete filter.price;
  }

  const limit = 12;
  const currentPage = Math.max(parseInt(page || '1', 10) || 1, 1);
  const skip = (currentPage - 1) * limit;

  const [cars, total, categories] = await Promise.all([
    Car.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('category', 'name'),
    Car.countDocuments(filter),
    VehicleCategory.find().sort({ name: 1 })
  ]);

  const bannersSetting = await SiteSetting.findOne({ key: 'customerBanners' });
  const customerBanners = parseCustomerBanners(bannersSetting ? bannersSetting.value : '');

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.render('cars/list', {
    cars,
    categories,
    customerBanners,
    filters: {
      q: q || '',
      make: make || '',
      model: model || '',
      year: year || '',
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
    },
    pagination: {
      total,
      totalPages,
      currentPage
    }
  });
});

router.get('/new', requireAuth, requireRole('admin'), async (req, res) => {
  const categories = await VehicleCategory.find().sort({ name: 1 });
  res.render('cars/form-luxury', { categories, currentUser: req.session.user, csrfToken: req.csrfToken ? req.csrfToken() : '' });
});

// إنشاء سيارة متجر جديدة (admin)
router.post('/new', requireAuth, requireRole(['admin', 'super_admin', 'manager']), (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      const msg = err.message === 'Invalid file type'
        ? 'نوع الملف غير مسموح. ارفع صور بصيغة JPG/PNG/WEBP فقط.'
        : 'تعذر رفع الصور. تأكد أن حجم الصورة لا يتجاوز 5MB.';
      if (req.session) req.session.flash = { type: 'danger', message: msg };
      return res.redirect('/cars/new');
    }
    next();
  });
}, async (req, res) => {
  try {
    const {
      title,
      make,
      makeLogoUrl,
      model,
      year,
      mileage,
      condition,
      description,
      price,
      priceSar,
      priceUsd,
      category
    } = req.body;

    const parsedPriceSar = toNumberOrNull(priceSar);
    const parsedPriceUsd = toNumberOrNull(priceUsd);
    const parsedLegacyPrice = toNumberOrNull(price);
    const computedLegacyPrice = parsedLegacyPrice !== null
      ? parsedLegacyPrice
      : (parsedPriceSar !== null ? parsedPriceSar : parsedPriceUsd);

    if (computedLegacyPrice === null) {
      if (req.session) req.session.flash = { type: 'danger', message: 'يرجى إدخال السعر (SAR) أو (USD) على الأقل.' };
      return res.redirect('/cars/new');
    }

    const imageUrls = [];
    for (const f of (req.files || [])) {
      const p = await saveMulterFileToUploads(f, 'cars');
      if (p) imageUrls.push(p);
    }

    await Car.create({
      seller: req.session.user._id,
      listingType: 'store',
      title: String(title || '').trim() || `${String(make || '').trim()} ${String(model || '').trim()}`.trim(),
      make: String(make || '').trim(),
      makeLogoUrl: String(makeLogoUrl || '').trim(),
      model: String(model || '').trim(),
      year: toNumberOrNull(year),
      mileage: toNumberOrNull(mileage),
      condition: condition || 'good',
      description: String(description || '').trim(),
      price: computedLegacyPrice,
      priceSar: parsedPriceSar,
      priceUsd: parsedPriceUsd,
      images: imageUrls,
      category: category || null,
      isActive: true,
      isSold: false
    });

    if (req.session) req.session.flash = { type: 'success', message: 'تمت إضافة السيارة بنجاح.' };
    return res.redirect('/admin/cars');
  } catch (error) {
    console.error('Error creating car:', error);
    if (req.session) req.session.flash = { type: 'danger', message: 'حدث خطأ أثناء إضافة السيارة.' };
    return res.redirect('/cars/new');
  }
});

// تفاصيل سيارة
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير موجودة' });
    }
    const car = await Car.findById(req.params.id).populate('category', 'name');
    if (!car) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير موجودة' });
    if (car.isSold) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير متاحة' });
    if (car.isActive === false) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير متاحة' });

    let auctionUrl = null;
    if (car.listingType === 'auction') {
      const auction = await Auction.findOne({ car: car._id }).select('_id').lean();
      if (auction) auctionUrl = `/auctions/${auction._id}`;
    }

    return res.render('cars/details', {
      car,
      auctionUrl,
      currentUser: req.session?.user || null,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error loading car details:', error);
    return res.status(500).render('errors/500', { layout: 'layout', message: 'حدث خطأ في تحميل السيارة', error });
  }
});

// تعديل سيارة (admin)
router.get('/:id/edit', requireAuth, requireRole(['admin', 'super_admin', 'manager']), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('category');
    if (!car) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير موجودة' });
    const categories = await VehicleCategory.find().sort({ name: 1 });
    return res.render('cars/form-luxury', { car, categories, currentUser: req.session.user, csrfToken: req.csrfToken ? req.csrfToken() : '' });
  } catch (error) {
    console.error('Error loading car for edit:', error);
    return res.status(500).render('errors/500', { layout: 'layout', message: 'حدث خطأ أثناء تحميل السيارة', error });
  }
});

router.post('/:id/edit', requireAuth, requireRole(['admin', 'super_admin', 'manager']), (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      const msg = err.message === 'Invalid file type'
        ? 'نوع الملف غير مسموح. ارفع صور بصيغة JPG/PNG/WEBP فقط.'
        : 'تعذر رفع الصور. تأكد أن حجم الصورة لا يتجاوز 5MB.';
      if (req.session) req.session.flash = { type: 'danger', message: msg };
      return res.redirect(`/cars/${req.params.id}/edit`);
    }
    next();
  });
}, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير موجودة' });

    const {
      title,
      make,
      makeLogoUrl,
      model,
      year,
      mileage,
      condition,
      description,
      price,
      priceSar,
      priceUsd,
      category
    } = req.body;

    const parsedPriceSar = toNumberOrNull(priceSar);
    const parsedPriceUsd = toNumberOrNull(priceUsd);
    const parsedLegacyPrice = toNumberOrNull(price);
    const computedLegacyPrice = parsedLegacyPrice !== null
      ? parsedLegacyPrice
      : (parsedPriceSar !== null ? parsedPriceSar : parsedPriceUsd);

    car.title = String(title || '').trim() || car.title;
    car.make = String(make || '').trim();
    car.makeLogoUrl = String(makeLogoUrl || '').trim();
    car.model = String(model || '').trim();
    car.year = toNumberOrNull(year);
    car.mileage = toNumberOrNull(mileage);
    car.condition = condition || car.condition;
    car.description = String(description || '').trim();
    car.price = computedLegacyPrice !== null ? computedLegacyPrice : car.price;
    car.priceSar = parsedPriceSar !== null ? parsedPriceSar : car.priceSar;
    car.priceUsd = parsedPriceUsd !== null ? parsedPriceUsd : car.priceUsd;
    car.category = category || null;

    const newImages = [];
    for (const f of (req.files || [])) {
      const p = await saveMulterFileToUploads(f, 'cars');
      if (p) newImages.push(p);
    }
    if (newImages.length) car.images = [...(car.images || []), ...newImages];

    await car.save();
    if (req.session) req.session.flash = { type: 'success', message: 'تم تحديث السيارة بنجاح.' };
    return res.redirect('/admin/cars');
  } catch (error) {
    console.error('Error updating car:', error);
    if (req.session) req.session.flash = { type: 'danger', message: 'حدث خطأ أثناء تحديث السيارة.' };
    return res.redirect(`/cars/${req.params.id}/edit`);
  }
});

router.post('/:id/delete', requireAuth, requireRole(['admin', 'super_admin', 'manager']), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      if (req.session) req.session.flash = { type: 'danger', message: 'السيارة غير موجودة.' };
      return res.redirect('/admin/cars');
    }
    if (car.isSold) {
      if (req.session) req.session.flash = { type: 'danger', message: 'لا يمكن حذف سيارة تم بيعها.' };
      return res.redirect('/admin/cars');
    }
    await Car.findByIdAndDelete(req.params.id);
    if (req.session) req.session.flash = { type: 'success', message: 'تم حذف السيارة بنجاح.' };
    return res.redirect('/admin/cars');
  } catch (error) {
    console.error('Error deleting car:', error);
    if (req.session) req.session.flash = { type: 'danger', message: 'حدث خطأ أثناء حذف السيارة.' };
    return res.redirect('/admin/cars');
  }
});

// مشترياتي (buyer)
router.get('/my-cars', requireAuth, requireRole('buyer'), async (req, res) => {
  try {
    const user = req.session.user;
    const [cars, bannersSetting] = await Promise.all([
      Car.find({ isSold: true, soldTo: user._id }).sort({ soldAt: -1, createdAt: -1 }),
      SiteSetting.findOne({ key: 'customerBanners' })
    ]);
    const customerBanners = parseCustomerBanners(bannersSetting ? bannersSetting.value : '');
    return res.render('cars/my-cars', { cars, customerBanners, currentUser: user });
  } catch (error) {
    console.error('Error loading my cars:', error);
    return res.status(500).render('errors/500', { layout: 'layout', message: 'حدث خطأ أثناء تحميل مشترياتك', error });
  }
});

// شراء سيارة (buyer) -> إنشاء طلب + pending token
router.post('/buy/:id', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    if (!user || user.role !== 'buyer') {
      if (req.session) req.session.flash = { type: 'danger', message: 'عملية الشراء متاحة للعملاء فقط.' };
      return res.redirect('/auth/login');
    }

    const car = await Car.findById(req.params.id);
    if (!car || car.isSold || car.isActive === false) {
      if (req.session) req.session.flash = { type: 'danger', message: 'السيارة غير متاحة.' };
      return res.redirect('/cars/list');
    }
    if ((car.listingType || 'store') === 'auction') {
      if (req.session) req.session.flash = { type: 'info', message: 'هذه سيارة مزاد. يرجى التواصل عبر صفحة المزاد.' };
      return res.redirect(`/auctions/car/${car._id}`);
    }

    const whatsappSetting = await SiteSetting.findOne({ key: 'customerWhatsAppNumber' });
    const raw = whatsappSetting ? String(whatsappSetting.value || '').trim() : '';
    const waNumber = raw.replace(/[^0-9]/g, '');
    if (!waNumber) {
      if (req.session) req.session.flash = { type: 'danger', message: 'رقم واتساب خدمة العملاء غير مضبوط.' };
      return res.redirect('/cars/list');
    }

    const token = crypto.randomBytes(20).toString('hex');
    car.pendingSaleToken = token;
    car.pendingSaleBuyer = user._id;
    car.pendingSaleAt = new Date();
    await car.save();

    const baseUrl = (process.env.BASE_URL && String(process.env.BASE_URL).trim())
      ? String(process.env.BASE_URL).trim().replace(/\/$/, '')
      : `${req.protocol}://${req.get('host')}`;
    const confirmUrl = `${baseUrl}/cars/sale/confirm/${car._id}/${token}`;

    const sar = (car.priceSar !== undefined && car.priceSar !== null) ? car.priceSar : null;
    const usd = (car.priceUsd !== undefined && car.priceUsd !== null) ? car.priceUsd : null;
    const legacy = (car.price !== undefined && car.price !== null) ? car.price : null;
const sarText = sar !== null ? `${sar.toLocaleString('en-US')} SAR` : '';
    const usdText = usd !== null ? `${usd.toLocaleString('en-US')} USD` : '';
    const priceText = [sarText, usdText].filter(Boolean).join(' | ') || (legacy !== null ? String(legacy) : 'غير محدد');

    const unitSar = sar !== null ? sar : (legacy !== null ? legacy : null);
    const unitUsd = usd !== null ? usd : null;

    let lastErr = null;
    for (let i = 0; i < 3; i++) {
      const orderNumber = await createOrderNumber();
      try {
        const order = await Order.create({
          orderNumber,
          buyer: user._id,
          items: [{
            itemType: 'car',
            refId: car._id,
            titleSnapshot: car.title,
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
          },
          meta: {
            pendingSaleToken: token,
            pendingSaleConfirmUrl: confirmUrl
          }
        });

        return res.redirect(`/orders/${order._id}/invoice`);
      } catch (err) {
        lastErr = err;
        if (err && err.code === 11000) continue;
        throw err;
      }
    }

    console.error('Order number collision:', lastErr);
    if (req.session) req.session.flash = { type: 'danger', message: 'تعذر إنشاء رقم الطلب. حاول مرة أخرى.' };
    return res.redirect('/cars/list');
  } catch (error) {
    console.error('Error buying car:', error);
    if (req.session) req.session.flash = { type: 'danger', message: 'تعذر إنشاء طلب الشراء. حاول مرة أخرى.' };
    return res.redirect('/cars/list');
  }
});

router.post('/new', requireAuth, requireRole('admin'), (req, res, next) => {
  // إنشاء سيارة جديدة (admin) مع رفع الصور عبر multer
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      const msg = err.message === 'Invalid file type'
        ? 'نوع الملف غير مسموح. ارفع صور بصيغة JPG/PNG/WEBP فقط.'
        : 'تعذر رفع الصور. تأكد أن حجم الصورة لا يتجاوز 5MB وأن العدد لا يزيد عن 5.';
      return res.status(400).send(msg);
    }
    next();
  });
}, async (req, res) => {
  // حفظ بيانات السيارة ثم تحويل الأدمن لصفحة إنشاء مزاد لهذه السيارة
  const { title, make, makeLogoUrl, model, year, mileage, condition, description, price, priceSar, priceUsd, category } = req.body;

  // رفع الصور إلى Firebase والحصول على الروابط
  const imagePromises = (req.files || []).map(file => uploadToFirebase(file, 'cars'));
  const images = await Promise.all(imagePromises);

  const parsedPriceSar = toNumberOrNull(priceSar);
  const parsedPriceUsd = toNumberOrNull(priceUsd);
  const parsedLegacyPrice = toNumberOrNull(price);
  const computedLegacyPrice = parsedLegacyPrice !== null
    ? parsedLegacyPrice
    : (parsedPriceSar !== null ? parsedPriceSar : parsedPriceUsd);

  if (computedLegacyPrice === null) {
    return res.status(400).send('يرجى إدخال السعر (SAR) أو (USD) على الأقل.');
  }

  const car = await Car.create({
    seller: req.session.user._id,
    title,
    make,
    makeLogoUrl,
    model,
    year,
    mileage,
    condition,
    description,
    price: computedLegacyPrice,
    priceSar: parsedPriceSar,
    priceUsd: parsedPriceUsd,
    images,
    category: category || null
  });

  // Send notification to all buyers about new car
  const NotificationService = require('../services/NotificationService');
  await NotificationService.sendNewItemNotification(car, 'car');

  res.redirect(`/auctions/create/${car._id}`);
});

router.get('/sale/confirm/:id/:token', requireAuth, requireRole('admin'), async (req, res) => {
  // صفحة تأكيد بيع السيارة (admin): التحقق من التوكن ثم عرض صفحة confirm-sale
  const car = await Car.findById(req.params.id).populate('pendingSaleBuyer', 'name');
  if (!car) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير موجودة' });
  if (car.isSold) {
    if (req.session) req.session.flash = { type: 'info', message: 'هذه السيارة تم بيعها مسبقاً.' };
    return res.redirect('/admin');
  }
  if (!car.pendingSaleToken || car.pendingSaleToken !== req.params.token) {
    return res.status(403).send('Forbidden');
  }
res.render('admin/confirm-sale', {
    layout: 'layout',
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    car,
    token: req.params.token
  });
});

router.post('/sale/confirm/:id/:token', requireAuth, requireRole(['admin', 'super_admin', 'manager']), async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).render('errors/404', { layout: 'layout', message: 'السيارة غير موجودة' });
  if (car.isSold) {
    if (req.session) req.session.flash = { type: 'info', message: 'هذه السيارة تم بيعها مسبقاً.' };
    return res.redirect('/admin');
  }
  if (!car.pendingSaleToken || car.pendingSaleToken !== req.params.token) {
    return res.status(403).send('Forbidden');
  }

  car.isSold = true;
  car.soldTo = car.pendingSaleBuyer || null;
  car.soldAt = new Date();
  car.pendingSaleToken = '';
  car.pendingSaleBuyer = null;
  car.pendingSaleAt = null;
  await car.save();

req.session.flash = { type: 'success', message: 'تم تأكيد البيع وإخفاء السيارة من المتجر.' };
  res.redirect('/admin');
});

// عرض سيارة + مزاد
router.get('/:id', async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id).populate('category', 'name');
    if (!car) return res.status(404).send('Car not found');
    if (car.isSold) return res.status(404).send('Car not found');

    let auctionUrl = null;
    if (car.listingType === 'auction') {
      const auction = await Auction.findOne({ car: car._id }).select('_id').lean();
      if (auction) auctionUrl = `/auctions/${auction._id}`;
    }

    res.render('cars/details', {
      car,
      auctionUrl,
      currentUser: req.session.user || null,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).send('Car not found');
    }
    next(error);
  }
});

// Edit car page (admin only)
router.get('/:id/edit', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('category');
    if (!car) return res.status(404).send('Car not found');

    const categories = await VehicleCategory.find().sort({ name: 1 });
    res.render('cars/form', { car, categories, isEdit: true });
  } catch (error) {
    console.error('Error loading car for edit:', error);
    res.status(500).render('errors/500', { error });
  }
});

// Update car (admin only)
router.post('/:id/edit', requireAuth, requireRole('admin'), upload.array('images', 5), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).send('Car not found');

    const {
      title,
      description,
      price,
      priceSar,
      priceUsd,
      make,
      model,
      year,
      mileage,
      fuelType,
      transmission,
      color,
      condition,
      categoryId
    } = req.body;

    // Update car fields
    car.title = title;
    car.description = description;
    car.price = price ? Number(price) : null;
    car.priceSar = priceSar ? Number(priceSar) : null;
    car.priceUsd = priceUsd ? Number(priceUsd) : null;
    car.make = make;
    car.model = model;
    car.year = year ? Number(year) : null;
    car.mileage = mileage ? Number(mileage) : null;
    car.fuelType = fuelType;
    car.transmission = transmission;
    car.color = color;
    car.condition = condition;
    car.category = categoryId;

    // Handle images
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file => uploadToFirebase(file, 'cars'));
      const newImages = await Promise.all(imagePromises);
      car.images = [...(car.images || []), ...newImages.filter(img => img !== null)];
    }

    await car.save();

    req.session.flash = { type: 'success', message: 'تم تحديث السيارة بنجاح' };
    res.redirect('/admin/cars');
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).render('errors/500', { error });
  }
});

// Delete car (admin only)
router.post('/:id/delete', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).send('Car not found');

    if (car.isSold) {
      req.session.flash = { type: 'error', message: 'لا يمكن حذف سيارة تم بيعها' };
      return res.redirect('/admin/cars');
    }

    await Car.findByIdAndDelete(req.params.id);

    req.session.flash = { type: 'success', message: 'تم حذف السيارة بنجاح' };
    res.redirect('/admin/cars');
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).render('errors/500', { error });
  }
});

// اختيار سيارة وإنشاء إشعار للإدارة
router.post('/select/:id', requireAuth, requireRole('admin'), async (req, res) => {
  // إنشاء إشعار اختيار سيارة من الأدمن (يظهر في لوحة التحكم)
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).send('Car not found');
  await Notification.create({ user: req.session.user._id, car: car._id });
  console.log(`Admin notice: user ${req.session.user._id} selected car ${car._id}`);
  res.redirect('/cars');
});

module.exports = router;
