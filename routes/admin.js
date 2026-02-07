// [[ARABIC_HEADER]] هذا الملف (routes/admin.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const cheerio = require('cheerio');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
// const { requirePermission, getDefaultPermissions } = require('../middleware/permissions');
const Car = require('../models/Car');
const SparePart = require('../models/SparePart');
const User = require('../models/User');
const Settings = require('../models/Settings');

/**
 * routes/admin.js
 * وصف الملف (عربي):
 * - هذا الملف يحتوي جميع مسارات واجهة الإدارة (Admin Panel).
 * - مسؤول عن إدارة السيارات، المزادات، الطلبات، الإعدادات، التقارير، والرسائل.
 * - يحتوي على middlewares خاصة بالتحقق من الصلاحيات (requireAdmin, requireSuperAdmin).
 * ملاحظة: تجنّب تمرير كائن باسم `settings` إلى res.render لأنه يتصادم مع إعدادات Express/ejs-mate.
 */

/**
 * تحديث أسعار المنتجات بناءً على سعر الصرف الجديد
 * @param {number} newRate - سعر الصرف الجديد (1 USD = X SAR)
 */
async function updateProductPrices(newRate) {
  try {
    // تحديث أسعار السيارات
    await Car.updateMany(
      { currency: 'USD' },
      [
        {
          $set: {
            priceSar: { $multiply: ['$price', newRate] },
            priceUsd: '$price',
            lastPriceUpdate: new Date()
          }
        }
      ]
    );

    // تحديث أسعار قطع الغيار
    await SparePart.updateMany(
      { currency: 'USD' },
      [
        {
          $set: {
            priceSar: { $multiply: ['$price', newRate] },
            priceUsd: '$price',
            lastPriceUpdate: new Date()
          }
        }
      ]
    );

    console.log(`✅ تم تحديث أسعار المنتجات بناءً على سعر الصرف الجديد: ${newRate}`);
  } catch (error) {
    console.error('❌ فشل تحديث أسعار المنتجات:', error);
    throw error;
  }
}
const Notification = require('../models/Notification');
const VehicleCategory = require('../models/VehicleCategory');
const ExchangeRate = require('../models/ExchangeRate');
const SiteSetting = require('../models/SiteSetting');
const SupportMessage = require('../models/SupportMessage');
const Order = require('../models/Order');
const Brand = require('../models/Brand');
const SpareBrand = require('../models/SpareBrand');
// Firebase completely removed - using local storage only
// const { bucket } = require('../config/firebase');
const { saveMulterFileToUploads } = require('../utils/uploadStorage');
const lotteAuctionSync = require('../services/lotteAuctionSync');

// لوحة الإدارة (Admin Panel):
// - إشعارات اختيار السيارات
// - إدارة الطلبات
// - إدارة الشركات (Brands)
// - إدارة فئات السيارات
// - إدارة قطع الغيار
// - إعدادات المزاد المباشر + رقم واتساب + بنرات العملاء
// - رسائل الدعم

// دالة لتحويل قيمة إلى رقم أو قيمة فارغة
function toNumberOrNull(v) {
  // إذا كانت القيمة فارغة أو غير محددة، أرجع قيمة فارغة
  if (v === undefined || v === null || String(v).trim() === '') return null;
  // تحويل القيمة إلى رقم
  const n = Number(v);
  // إذا كان الرقم محددًا، أرجعه، وإلا أرجع قيمة فارغة
  return Number.isFinite(n) ? n : null;
}

// مجموعة من ال middlewares للتحقق من صلاحية الإدارة
const requireAdmin = [requireAuth, requireRole(['admin', 'super_admin', 'manager'])];
const requireSuperAdmin = [requireAuth, requireRole('super_admin')];

// دالة مساعدة لرفع الملفات محلياً داخل uploads وإرجاع رابط قابل للعرض
// تم الإبقاء على اسم الدالة لتجنب تعديل كبير: الآن تستخدم التخزين المحلي
async function uploadToFirebase(file, folder = 'misc') {
  return saveMulterFileToUploads(file, folder);
}

// رفع صور قطع الغيار (حتى 5 صور)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

// رفع شعار الشركة (ملف واحد)
const brandUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

router.get('/', requireAdmin, async (req, res) => {
  console.log('🔍 Admin dashboard accessed by:', req.session.user);

  try {
    const [notifications, totalCars, totalUsers] = await Promise.all([
      Notification.find()
        .sort({ createdAt: -1 })
        .populate({
          path: 'user',
          select: 'name phone'
        })
        .populate({
          path: 'car',
          select: 'title price priceSar priceUsd'
        }),
      Car.countDocuments(),
      User.countDocuments()
    ]);

    const unseenCount = notifications.filter(n => n.status === 'new').length;

    // ensure siteSettings available in templates but do not override Express options.settings
    res.locals.siteSettings = await Settings.findOne() || {
      whatsapp: { enabled: false, number: '', welcomeMessage: 'مرحباً! كيف يمكنني مساعدتك؟' },
      footer: { companyName: '', phone: '', email: '', address: '', description: '', quickLinks: [] }
    };

    const usersList = await User.find({ role: { $in: ['admin', 'manager', 'super_admin'] } }).select('-password');

res.render('admin/dashboard', {
      layout: 'layout',
      bodyClass: 'hm-admin-page',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      notifications,
      stats: {
        totalCars,
        totalUsers,
        unseenCount
      },
      currentUser: req.session.user,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading admin dashboard:', error);
res.render('admin/dashboard', {
      layout: 'layout',
      bodyClass: 'hm-admin-page',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      notifications: [],
      stats: { totalCars: 0, totalUsers: 0, unseenCount: 0 },
      currentUser: req.session.user,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  }
});

// قائمة المستخدمين البسيطة (Admin users list)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching users for admin...');
    const users = await User.find().sort({ createdAt: -1 }).limit(200).select('name email phone role createdAt');
    console.log('📊 Users found:', users.length);
    console.log('👤 First user:', users[0] ? users[0].name : 'None');
    res.render('admin/users', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      users,
      currentUser: req.session.user,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).render('errors/500', { error });
  }
});

router.post('/notifications/:id/seen', requireAdmin, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { status: 'seen' });
  res.redirect('/admin');
});

router.post('/notifications/mark-all-seen', requireAdmin, async (req, res) => {
  await Notification.updateMany({ status: 'new' }, { status: 'seen' });
  res.redirect('/admin');
});

router.get('/orders', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(String(status))) {
    filter.status = String(status);
  }

  let buyerIds = null;
  if (q && String(q).trim()) {
    const query = String(q).trim();
    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const buyers = await User.find({ name: re }).select('_id');
    buyerIds = buyers.map(b => b._id);
    filter.$or = [{ orderNumber: re }];
    if (buyerIds.length) filter.$or.push({ buyer: { $in: buyerIds } });
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('buyer', 'name role buyerDeviceId');

  res.render('admin/orders', {
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    orders,
    filters: { status: status || '', q: q || '' },
    currentUser: req.session.user,
    flash: req.session.flash || null
  });
  req.session.flash = null;
});

router.post('/orders/:id/status', requireAdmin, async (req, res) => {
  // reuse central status change logic in /orders/:id/status
  req.url = `/orders/${req.params.id}/status`;
  return res.redirect(307, `/orders/${req.params.id}/status`);
});

router.post('/buyers/:id/unbind-device', requireAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { buyerDeviceId: '', activeSessionId: '' });
  const back = req.get('referer') || '/admin/orders';
  return res.redirect(back);
});

// إدارة الشركات (Brands)
router.get('/brands', requireAdmin, async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  console.log(`📋 GET /brands: Found ${brands.length} brands`);
  res.render('admin/brands', {
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    brands,
    currentUser: req.session.user,
    flash: req.session.flash || null,
    csrfToken: req.csrfToken()
  });
  req.session.flash = null;
});

router.post('/brands', requireAdmin, brandUpload.single('logo'), async (req, res) => {
  try {
    console.log('📝 POST /brands Body:', req.body);
    console.log('📁 POST /brands File:', req.file ? req.file.originalname : 'No file');

    const { name } = req.body;
    let logoUrl = '';

    if (req.file) {
      logoUrl = await uploadToFirebase(req.file, 'brands');
    }

    if (!name) {
      req.flash('error', 'اسم الوكالة مطلوب.');
      return res.redirect('/admin/brands');
    }

    // Checkboxes send 'on' if checked, undefined if not.
    // If neither is checked, default to forCars=true (safety fallback)
    let forCars = req.body.forCars === 'on';
    let forSpareParts = req.body.forSpareParts === 'on';

    // If user selected nothing, default to cars
    if (!forCars && !forSpareParts) {
      forCars = true;
    }

    const newBrand = await Brand.create({ name, logoUrl, forCars, forSpareParts });
    console.log('✅ Brand Created:', newBrand);

    req.flash('success', 'تمت إضافة الوكالة بنجاح.');
    res.redirect('/admin/brands');
  } catch (error) {
    console.error('❌ Error adding brand:', error);
    // Expose specific error for debugging (REMOVE IN PROD if sensitive, but ok for now)
    const msg = error.code === 11000 ? 'هذه الماركة موجودة بالفعل' : ('حدث خطأ: ' + error.message);
    req.flash('error', msg);
    res.redirect('/admin/brands');
  }
});

router.post('/brands/:id/edit', requireAdmin, brandUpload.single('logo'), async (req, res) => {
  try {
    const { name, logoUrl: logoUrlBody } = req.body;
    const brand = await Brand.findById(req.params.id);

if (!brand) {
      req.flash('error', 'لم يتم العثور على الوكالة.');
      return res.redirect('/admin/brands');
    }

    let logoUrl = brand.logoUrl;

    if (req.file) {
      // Handle file upload
      logoUrl = await uploadToFirebase(req.file, 'brands');
    }

    brand.name = name;
    brand.logoUrl = logoUrl;

    // Update flags
    brand.forCars = req.body.forCars === 'on';
    brand.forSpareParts = req.body.forSpareParts === 'on';

    // Fallback: if unchecking both, keep at least one (optional logic, but good UX)
    if (!brand.forCars && !brand.forSpareParts) {
      brand.forCars = true;
    }

    await brand.save();

    req.flash('success', 'تم تعديل الوكالة بنجاح.');
    res.redirect('/admin/brands');
  } catch (error) {
    console.error(error);
    req.flash('error', 'حدث خطأ أثناء تعديل الوكالة.');
    res.redirect('/admin/brands');
  }
});


router.post('/brands/:id/delete', requireAdmin, async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  if (req.session) req.session.flash = { type: 'success', message: 'تم حذف الشركة.' };
  return res.redirect('/admin/brands');
});

// إدارة فئات السيارات
router.get('/categories', requireAdmin, async (req, res) => {
  const categories = await VehicleCategory.find().sort({ name: 1 });
  res.render('admin/categories', {
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    categories,
    currentUser: req.session.user,
    flash: req.session.flash || null
  });
  req.session.flash = null;
});

router.post('/categories', requireAdmin, async (req, res) => {
  const { name, description, coverImage } = req.body;
  await VehicleCategory.create({ name, description, coverImage });
  res.redirect('/admin/categories');
});

// إدارة قطع الغيار
// إدارة قطع الغيار
router.get('/spare-parts', requireAdmin, async (req, res) => {
  const [parts, brands] = await Promise.all([
    SparePart.find().populate('brand').sort({ createdAt: -1 }),
    Brand.find({ forSpareParts: true }).sort({ name: 1 })
  ]);
  res.render('admin/spare-parts', {
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    parts,
    brands, // Unified brands
    currentUser: req.session.user,
    flash: req.session.flash || null
  });
  req.session.flash = null;
});

router.post('/spare-parts', requireAdmin, (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      const msg = err.message === 'Invalid file type'
        ? 'نوع الملف غير مسموح. ارفع صور بصيغة JPG/PNG/WEBP فقط.'
        : 'تعذر رفع الصور. تأكد أن حجم الصورة لا يتجاوز 5MB وأن العدد لا يزيد عن 5.';
      if (req.session) req.session.flash = { type: 'danger', message: msg };
      return res.redirect('/admin/spare-parts');
    }
    next();
  });
}, async (req, res) => {
const { name, partType, brand, carMake, carMakeLogoUrl, carModel, carYear, price, priceSar, priceUsd, description, inStock, stockQty } = req.body;

  const imagePromises = (req.files || []).map(file => uploadToFirebase(file, 'spare-parts'));
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

  const parsedStockQty = toNumberOrNull(stockQty);
  const finalStockQty = parsedStockQty === null ? 0 : Math.max(parsedStockQty, 0);
  const finalInStock = finalStockQty > 0 ? true : (inStock === 'on');

  const brandId = String(brand || '').trim();
  const brandObj = brandId ? await Brand.findById(brandId) : null;

await SparePart.create({
    name,
    partType,
    brand: brandObj ? brandObj._id : null,
    carMake,
    carMakeLogoUrl,
    carModel,
    carYear,
    price: computedLegacyPrice,
    priceSar: parsedPriceSar,
    priceUsd: parsedPriceUsd,
    description,
    images,
    stockQty: finalStockQty,
    inStock: finalInStock
  });

  // Send notification to all buyers about new spare part
    const NotificationService = require('../services/NotificationService');
    const newSparePart = await SparePart.findOne({ name }).sort({ createdAt: -1 });
    if (newSparePart) {
      await NotificationService.sendNewItemNotification(newSparePart, 'spare_part');
    }

    if (req.session) req.session.flash = { type: 'success', message: 'تمت إضافة قطعة الغيار بنجاح.' };
    return res.redirect('/admin/spare-parts');
  } catch (error) {
    console.error('❌ Error creating spare part:', error);
    if (req.session) req.session.flash = { type: 'danger', message: 'حدث خطأ أثناء إضافة قطعة الغيار.' };
    return res.redirect('/admin/spare-parts');
  }
});




router.post('/spare-parts/:id/delete', requireAdmin, async (req, res) => {
  await SparePart.findByIdAndDelete(req.params.id);
  res.redirect('/admin/spare-parts');
});

// إعداد رابط المزاد المباشر
router.get('/live-auction', requireAdmin, async (req, res) => {
  const [setting, waSetting] = await Promise.all([
    SiteSetting.findOne({ key: 'liveAuctionUrl' }),
    SiteSetting.findOne({ key: 'customerWhatsAppNumber' })
  ]);
  const [bannersSetting, endsAtSetting, lastSyncSetting] = await Promise.all([
    SiteSetting.findOne({ key: 'customerBanners' }),
    SiteSetting.findOne({ key: 'externalAuctionEndsAt' }),
    SiteSetting.findOne({ key: 'externalAuctionLastSync' })
  ]);

  const endsAtRaw = endsAtSetting ? String(endsAtSetting.value || '').trim() : '';
  const endsAtIso = endsAtRaw && !Number.isNaN(new Date(endsAtRaw).getTime()) ? new Date(endsAtRaw).toISOString() : '';
  res.render('admin/live-auction', {
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    liveAuctionUrl: setting ? setting.value : '',
    customerWhatsAppNumber: waSetting ? waSetting.value : '',
    customerBanners: bannersSetting ? bannersSetting.value : '',
    externalAuctionEndsAt: endsAtIso,
    externalAuctionLastSync: lastSyncSetting ? lastSyncSetting.value : '',
    syncInfo: lotteAuctionSync.getRuntimeInfo(),
    currentUser: req.session.user,
    flash: req.session.flash || null
  });
  req.session.flash = null;
});

router.post('/live-auction', requireAdmin, async (req, res) => {
  const liveAuctionUrl = (req.body.liveAuctionUrl || '').trim();
  const customerWhatsAppNumber = (req.body.customerWhatsAppNumber || '').trim();
  const customerBanners = String(req.body.customerBanners || '').trim();
  const externalAuctionEndsAt = String(req.body.externalAuctionEndsAt || '').trim();
  const lotteUsername = String(req.body.lotteUsername || '').trim();
  const lottePassword = String(req.body.lottePassword || '').trim();

  if (externalAuctionEndsAt) {
    const t = new Date(externalAuctionEndsAt).getTime();
    if (Number.isNaN(t)) {
      if (req.session) req.session.flash = { type: 'danger', message: 'صيغة وقت انتهاء المزاد غير صحيحة.' };
      return res.redirect('/admin/live-auction');
    }
  }

  await SiteSetting.findOneAndUpdate(
    { key: 'liveAuctionUrl' },
    { value: liveAuctionUrl },
    { upsert: true, new: true }
  );

  await SiteSetting.findOneAndUpdate(
    { key: 'customerWhatsAppNumber' },
    { value: customerWhatsAppNumber },
    { upsert: true, new: true }
  );

  await SiteSetting.findOneAndUpdate(
    { key: 'customerBanners' },
    { value: customerBanners },
    { upsert: true, new: true }
  );

  await SiteSetting.findOneAndUpdate(
    { key: 'externalAuctionEndsAt' },
    { value: externalAuctionEndsAt ? new Date(externalAuctionEndsAt).toISOString() : '' },
    { upsert: true, new: true }
  );

  try {
    const io = req.app.get('io');
    if (liveAuctionUrl && externalAuctionEndsAt && lotteUsername && lottePassword) {
      await lotteAuctionSync.startOrUpdateSync({
        auctionUrl: liveAuctionUrl,
        username: lotteUsername,
        password: lottePassword,
        endsAt: externalAuctionEndsAt,
        io
      });
      if (req.session) req.session.flash = { type: 'success', message: 'تم حفظ الإعدادات وبدء مزامنة المزاد.' };
    } else {
      lotteAuctionSync.stopSync();
      if (req.session) req.session.flash = { type: 'success', message: 'تم حفظ الإعدادات. أدخل بيانات الدخول ووقت الانتهاء لتفعيل المزامنة.' };
    }
  } catch (e) {
    if (req.session) req.session.flash = { type: 'danger', message: 'تم حفظ الإعدادات لكن تعذر بدء المزامنة. تحقق من الرابط وبيانات الدخول.' };
  }

  res.redirect('/admin/live-auction');
});

// رسائل خدمة العملاء
router.get('/support', requireAdmin, async (req, res) => {
  try {
    const messages = await SupportMessage.find().sort({ createdAt: -1 });
    res.render('admin/support', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      messages,
      currentUser: req.session.user,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading support messages:', error);
    req.session.flash = { type: 'error', message: 'حدث خطأ في تحميل رسائل الدعم' };
    return res.redirect('/admin');
  }
});

// إدارة سعر الصرف
router.get('/exchange-rate', requireAdmin, async (req, res) => {
  try {
    let exchangeRate = await ExchangeRate.findOne()
      .sort({ createdAt: -1 })
      .populate('updatedBy', 'name email');

    if (!exchangeRate) {
      exchangeRate = await ExchangeRate.create({
        usdToSar: 3.75,
        updatedBy: req.session.user._id,
        notes: 'سعر الصرف الافتراضي',
        lastUpdated: new Date()
      });
      exchangeRate = await ExchangeRate.findById(exchangeRate._id)
        .populate('updatedBy', 'name email');
    }

    res.render('admin/exchange-rate', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      exchangeRate,
      notes: (exchangeRate && exchangeRate.notes) ? exchangeRate.notes : '',
      currentUser: req.session.user,
      flash: req.session.flash || null,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
    req.session.flash = null;
  } catch (err) {
    console.error('Error loading exchange rate:', err);
    if (req.session) {
      req.session.flash = { type: 'error', message: 'حدث خطأ في تحميل سعر الصرف' };
    }
    return res.redirect('/admin');
  }
});

// تحديث سعر الصرف
router.post('/exchange-rate', requireAdmin, async (req, res) => {
  const { usdToSar, notes } = req.body;

  // التحقق من صحة المدخلات
  if (!usdToSar || isNaN(parseFloat(usdToSar)) || parseFloat(usdToSar) <= 0) {
    if (req.session) {
      req.session.error = 'يرجى إدخال سعر صرف صحيح';
    }
    return res.redirect('/admin/exchange-rate');
  }

  try {
    // الحصول على آخر سعر صرف للمقارنة
    const lastRate = await ExchangeRate.findOne().sort({ createdAt: -1 });
    const newRate = parseFloat(parseFloat(usdToSar).toFixed(4));

    // التحقق مما إذا كان السعر الجديد يختلف عن الأخير
    if (lastRate && lastRate.usdToSar === newRate) {
      if (req.session) {
        req.session.warning = 'سعر الصرف الحالي مطابق للسعر المدخل. لم يتم إجراء أي تغييرات.';
      }
      return res.redirect('/admin/exchange-rate');
    }

    // إنشاء سجل جديد لسعر الصرف
    const exchangeRate = await ExchangeRate.create({
      usdToSar: newRate,
      notes: String(notes || '').trim(),
      updatedBy: req.session.user._id,
      lastUpdated: new Date()
    });

    // تحديث جميع المنتجات المعتمدة على سعر الصرف
    await updateProductPrices(newRate);

    // إضافة رسالة نجاح
    if (req.session) {
      req.session.success = `تم تحديث سعر الصرف بنجاح إلى ${exchangeRate.usdToSar.toFixed(4)} ريال سعودي للدولار`;
    }

    res.redirect('/admin/exchange-rate');
  } catch (err) {
    console.error('Error updating exchange rate:', err);
    if (req.session) {
      req.session.error = 'حدث خطأ أثناء تحديث سعر الصرف. يرجى المحاولة مرة أخرى.';
      if (err.errors) {
        req.session.error += ' ' + Object.values(err.errors).map(e => e.message).join('. ');
      }
    }
    res.redirect('/admin/exchange-rate');
  }
});

// API للحصول على أحدث سعر صرف
router.get('/api/exchange-rate/current', async (req, res) => {
  try {
    const exchangeRate = await ExchangeRate.findOne().sort({ createdAt: -1 });
    res.json({ rate: exchangeRate ? exchangeRate.usdToSar : 3.75 });
  } catch (err) {
    res.json({ rate: 3.75 });
  }
});

// إدارة السيارات (Admin cars management)
router.get('/cars', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching cars for admin...');
    const { page = 1, q, make, model, status } = req.query;
    const limit = 12;
    const skip = (page - 1) * limit;

    const filter = {};

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

    if (status) {
      if (status === 'sold') {
        filter.isSold = true;
      } else if (status === 'available') {
        filter.isSold = { $ne: true };
      }
    }

    console.log('🔎 Filter:', filter);

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name'),
      Car.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    console.log('📊 Cars found:', cars.length);
    console.log('📈 Total cars:', total);
    if (cars.length > 0) {
      console.log('🚗 First car:', cars[0].title || cars[0].make + ' ' + cars[0].model);
    }

    res.render('admin/cars', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      cars,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page, 10)
      },
      filters: {
        q: q || '',
        make: make || '',
        model: model || '',
        status: status || ''
      },
      currentUser: req.session.user,
      flash: req.session.flash || null,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error in admin cars:', error);
    res.status(500).render('errors/500', { error });
  }
});
// === إدارة المستخدمين والصلاحيات ===

// صفحة إدارة المشرفين
router.get('/users-management', requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'super_admin', 'manager'] } })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.render('admin/users-management', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      users,
      currentUser: req.session.user,
      flash: req.session.flash || null,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      roles: ['admin', 'super_admin', 'manager'],
      permissions: [
        'manage_users', 'manage_settings', 'manage_footer', 'manage_whatsapp',
        'manage_cars', 'manage_parts', 'manage_auctions', 'view_analytics', 'manage_content'
      ]
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading users management:', error);
    req.session.flash = {
      type: 'error',
      message: 'حدث خطأ في تحميل المستخدمين'
    };
    res.redirect('/admin');
  }
});

// إنشاء مشرف جديد
router.post('/users-management/create', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role, permissions } = req.body;

    // التحقق من عدم وجود البريد أو الهاتف مسبقاً
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو رقم الهاتف موجود بالفعل'
      });
    }

    const selectedPermissions = Array.isArray(permissions) ? permissions : [];

    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      permissions: selectedPermissions,
      createdBy: req.session.user._id,
      status: 'active'
    });

    await user.save();

    res.json({
      success: true,
      message: 'تم إنشاء المشرف بنجاح',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء المستخدم'
    });
  }
});

// تحديث مشرف
router.put('/users-management/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, role, permissions, status } = req.body;
    const userId = req.params.id;

    // منع تعديل نفسه
    if (userId === req.session.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك تعديل بياناتك من هذه الصفحة'
      });
    }

    const selectedPermissions = Array.isArray(permissions) ? permissions : [];

    const updateData = {
      name,
      email,
      phone,
      role,
      permissions: selectedPermissions,
      status
    };

    // إضافة كلمة المرور إذا تم إرسالها
    if (req.body.password && req.body.password.trim()) {
      updateData.password = req.body.password.trim();
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      user
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث المستخدم'
    });
  }
});

// حذف مشرف
router.delete('/users-management/:id', requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // منع حذف نفسه
    if (userId === req.session.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك'
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف المستخدم'
    });
  }
});

// === إدارة الإعدادات ===

// صفحة إدارة الواتساب
router.get('/settings/whatsapp', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.render('admin/settings/whatsapp', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      flash: req.session.flash || null,
      settings: settings || {},
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading WhatsApp settings:', error);
    res.render('admin/settings/whatsapp', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      flash: { type: 'error', message: 'حدث خطأ في تحميل إعدادات الواتساب' },
      settings: {},
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  }
});

// تحديث إعدادات الواتساب
router.post('/settings/whatsapp', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { phoneNumber, message, enabled } = req.body;

    const settings = await Settings.getSettings();
    settings.whatsapp.phoneNumber = phoneNumber;
    settings.whatsapp.message = message;
    settings.whatsapp.enabled = enabled === 'true';

    await settings.save();

    if (req.session) {
      req.session.flash = {
        type: 'success',
        message: 'تم تحديث إعدادات الواتساب بنجاح'
      };
    }

    res.redirect('/admin/settings/whatsapp');
  } catch (error) {
    console.error('❌ Error updating whatsapp settings:', error);
    if (req.session) {
      req.session.flash = {
        type: 'danger',
        message: 'حدث خطأ في تحديث الإعدادات'
      };
    }
    res.redirect('/admin/settings/whatsapp');
  }
});

// صفحة إدارة الشريط السفلي
router.get('/settings/footer', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.render('admin/settings/footer', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      footer: settings.footer,
      currentUser: req.session.user,
      flash: req.session.flash || null,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading footer settings:', error);
    req.session.flash = {
      type: 'error',
      message: 'حدث خطأ في تحميل الإعدادات'
    };
    res.redirect('/admin');
  }
});

// تحديث إعدادات الشريط السفلي
router.post('/settings/footer', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { title, description, email, phone, address, facebookUrl, twitterUrl, instagramUrl, whatsappNumber, youtubeUrl, tiktokUrl } = req.body;
    const links = JSON.parse(req.body.links || '[]');

    const settings = await Settings.getSettings();
    settings.footer.title = title;
    settings.footer.description = description;
    settings.footer.contactInfo.email = email;
    settings.footer.contactInfo.phone = phone;
    settings.footer.contactInfo.address = address;
    settings.footer.links = links;

    // روابط التواصل الاجتماعي
    settings.footer.facebookUrl = facebookUrl || '';
    settings.footer.twitterUrl = twitterUrl || '';
    settings.footer.instagramUrl = instagramUrl || '';
    settings.footer.whatsappNumber = whatsappNumber || '';
    settings.footer.youtubeUrl = youtubeUrl || '';
    settings.footer.tiktokUrl = tiktokUrl || '';

    await settings.save();

    if (req.session) {
      req.session.flash = {
        type: 'success',
        message: 'تم تحديث إعدادات الشريط السفلي بنجاح'
      };
    }

    res.redirect('/admin/settings/footer');
  } catch (error) {
    console.error('❌ Error updating footer settings:', error);
    if (req.session) {
      req.session.flash = {
        type: 'danger',
        message: 'حدث خطأ في تحديث الإعدادات'
      };
    }
    res.redirect('/admin/settings/footer');
  }
});

// API للحصول على رقم الواتساب الحالي
router.get('/api/whatsapp-number', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      phoneNumber: settings.whatsapp?.phoneNumber || ''
    });
  } catch (error) {
    console.error('❌ Error getting whatsapp number:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// صفحة الإعدادات العامة
router.get('/settings', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    res.render('admin/settings', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading settings page:', error);
    req.session.flash = {
      type: 'error',
      message: 'حدث خطأ في تحميل الصفحة'
    };
    res.redirect('/admin');
  }
});

// صفحة الإشعارات
router.get('/notifications', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const Notification = require('../models/Notification');

    // جلب جميع الإشعارات مع بيانات المستخدم والسيارة
    const notifications = await Notification.find()
      .populate('user', 'name email')
      .populate('car', 'title make model')
      .sort({ createdAt: -1 })
      .limit(50);

    res.render('admin/notifications', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      notifications,
      flash: req.session.flash || null,
      csrfToken: req.csrfToken()
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading notifications page:', error);
    req.session.flash = {
      type: 'error',
      message: 'حدث خطأ في تحميل الصفحة'
    };
    res.redirect('/admin');
  }
});

// إرسال إشعار
router.post('/notifications/send', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { title, message, type, recipients, link } = req.body;
    const Notification = require('../models/Notification');
    const User = require('../models/User');

    // تحديد المستلمين بناءً على الاختيار
    let targetUsers = [];
    if (recipients === 'all') {
      targetUsers = await User.find({}).select('_id');
    } else if (recipients === 'buyers') {
      targetUsers = await User.find({ role: 'buyer' }).select('_id');
    } else if (recipients === 'sellers') {
      targetUsers = await User.find({ role: 'seller' }).select('_id');
    } else if (recipients === 'admins') {
      targetUsers = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
    }

    // إنشاء إشعارات لكل مستخدم
    const notifications = targetUsers.map(userId => ({
      user: userId._id,
      title,
      message,
      type,
      link,
      status: 'new'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    req.session.flash = {
      type: 'success',
      message: `تم إرسال الإشعار بنجاح إلى ${notifications.length} مستخدم`
    };
    res.redirect('/admin/notifications');
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    req.session.flash = {
      type: 'error',
      message: 'حدث خطأ في إرسال الإشعار'
    };
    res.redirect('/admin/notifications');
  }
});

// صفحة المزادات الموحدة
router.get('/auctions', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const Auction = require('../models/Auction');
    const Order = require('../models/Order');

    const [auctions, totalCars, activeAuctions, totalUsers, totalOrders] = await Promise.all([
      Auction.find().populate('car').sort({ createdAt: -1 }).limit(50),
      Car.countDocuments(),
      Auction.countDocuments({ status: 'running' }),
      User.countDocuments(),
      Order.countDocuments()
    ]);

    const stats = {
      totalCars,
      activeAuctions,
      totalUsers,
      totalOrders
    };

    res.render('admin/auctions-unified', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      flash: req.session.flash || null,
      auctions: auctions || [],
      stats,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
    req.session.flash = null;
  } catch (error) {
    console.error('❌ Error loading auctions page:', error);
    res.render('admin/auctions-unified', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      flash: { type: 'error', message: 'حدث خطأ في تحميل المزادات' },
      auctions: [],
      stats: { totalCars: 0, activeAuctions: 0, totalUsers: 0, totalOrders: 0 },
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  }
});

// صفحة إنشاء مزاد جديد
router.get('/auctions/new', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  res.render('admin/create-auction', {
    bodyClass: 'admin-body',
    hideNavbar: true,
    hideSearch: true,
    fullWidth: true,
    currentUser: req.session.user,
    flash: req.session.flash || null,
    csrfToken: req.csrfToken ? req.csrfToken() : ''
  });
  req.session.flash = null;
});

// استيراد بيانات المزاد من رابط
router.post('/auctions/import', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  const { importUrl } = req.body;
  if (!importUrl) {
    req.session.flash = { type: 'danger', message: 'يرجى إدخال رابط صالح.' };
    return res.redirect('/admin/auctions/new');
  }

  try {
    const { data } = await axios.get(importUrl);
    const $ = cheerio.load(data);

    // محاولة استخراج البيانات الأساسية
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const price = $('meta[property="product:price:amount"]').attr('content');
    const currency = $('meta[property="product:price:currency"]').attr('content');

    // استخراج الصور
    const images = [];
    $('meta[property="og:image"]').each((i, el) => {
      images.push($(el).attr('content'));
    });
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:')) {
        images.push(new URL(src, importUrl).href);
      }
    });

    const uniqueImages = [...new Set(images)].slice(0, 10);

    // إعادة التوجيه إلى صفحة الإنشاء مع ملء البيانات
    res.render('admin/create-auction', {
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      currentUser: req.session.user,
      flash: { type: 'info', message: 'تم استيراد البيانات. يرجى مراجعتها قبل الحفظ.' },
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      importedData: {
        title: title.trim(),
        description: description ? description.trim() : '',
        price: price,
        currency: currency,
        images: uniqueImages.join('\n'),
        externalUrl: importUrl
      }
    });

  } catch (error) {
    console.error('Error importing auction data:', error);
    req.session.flash = { type: 'danger', message: 'فشل استيراد البيانات من الرابط.' };
    res.redirect('/admin/auctions/new');
  }
});

// Toggle car active status
router.post('/cars/:id/toggle-active', requireAdmin, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      req.session.flash = { type: 'error', message: 'السيارة غير موجودة' };
      return res.redirect('/admin/cars');
    }

    car.isActive = !car.isActive;
    await car.save();

    req.session.flash = {
      type: 'success',
      message: `تم ${car.isActive ? 'تفعيل' : 'إلغاء تفعيل'} السيارة بنجاح`
    };
    res.redirect('/admin/cars');
  } catch (error) {
    console.error('Error toggling car active status:', error);
    req.session.flash = { type: 'error', message: 'حدث خطأ في تحديث حالة السيارة' };
    res.redirect('/admin/cars');
  }
});

module.exports = router;
