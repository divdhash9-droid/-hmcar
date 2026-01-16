// routes/auctions.js
// مسارات المزادات: عرض مزاد مباشر (رابط)، سيارات المزاد، إنشاء مزاد، عرض تفاصيل المزاد
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const crypto = require('crypto');
const Auction = require('../models/Auction');
const Car = require('../models/Car');
const Bid = require('../models/Bid');
const SiteSetting = require('../models/SiteSetting');
const Order = require('../models/Order');
const User = require('../models/User');
const Brand = require('../models/Brand');

// الصفحة الرئيسية للمزادات
router.get('/', async (req, res) => {
  try {
    // جلب المزادات النشطة
    const auctions = await Auction.find({ status: 'running' })
      .populate('car')
      .sort({ createdAt: -1 })
      .limit(20);
    
    // جلب سيارات المزاد
    const cars = await Car.find({ listingType: 'auction', isSold: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.render('auctions/cars', { 
      auctions, 
      cars,
      title: 'المزادات'
    });
  } catch (error) {
    console.error('Error loading auctions:', error);
    res.status(500).render('errors/500');
  }
});

router.get('/live', async (req, res) => {
  const [setting, endsAtSetting, snapshotSetting, whatsappSetting] = await Promise.all([
    SiteSetting.findOne({ key: 'liveAuctionUrl' }),
    SiteSetting.findOne({ key: 'externalAuctionEndsAt' }),
    SiteSetting.findOne({ key: 'externalAuctionSnapshot' }),
    SiteSetting.findOne({ key: 'customerWhatsAppNumber' })
  ]);

  const liveAuctionUrl = setting ? String(setting.value || '').trim() : '';
  const endsAtRaw = endsAtSetting ? String(endsAtSetting.value || '').trim() : '';
  const endsAt = endsAtRaw && !Number.isNaN(new Date(endsAtRaw).getTime()) ? new Date(endsAtRaw) : null;
  const now = new Date();
  const isEnded = endsAt ? now > endsAt : false;

  let snapshot = { source: 'lotte', status: isEnded ? 'ended' : 'running', updatedAt: null, cars: [] };
  if (snapshotSetting && snapshotSetting.value) {
    try {
      snapshot = JSON.parse(String(snapshotSetting.value));
    } catch (e) {
      snapshot = { source: 'lotte', status: isEnded ? 'ended' : 'running', updatedAt: null, cars: [] };
    }
  }

  const raw = whatsappSetting ? String(whatsappSetting.value || '').trim() : '';
  const waNumber = raw.replace(/[^0-9]/g, '');

  const baseUrl = (process.env.BASE_URL && String(process.env.BASE_URL).trim())
    ? String(process.env.BASE_URL).trim().replace(/\/$/, '')
    : `${req.protocol}://${req.get('host')}`;
  const pageUrl = `${baseUrl}/auctions/live`;

  res.render('auctions/live', {
    liveAuctionUrl,
    endsAt,
    isEnded,
    snapshot,
    waNumber,
    pageUrl
  });
});

router.get('/cars', async (req, res) => {
  // قائمة سيارات المزاد (listingType=auction) التي لم تُبع بعد
  const cars = await Car.find({ listingType: 'auction', isSold: { $ne: true } }).sort({ createdAt: -1 });
  res.render('auctions/cars', { cars });
});

router.get('/cars/new', requireAuth, requireRole('admin'), async (req, res) => {
  // إعادة توجيه إلى صفحة المزادات الموحدة
  res.redirect('/admin/auctions');
});

router.post('/cars/new', requireAuth, requireRole('admin'), async (req, res) => {
  // إنشاء سيارة مزاد من الإدخال اليدوي (روابط صور + أسعار) ثم إنشاء مزاد running مباشرة
  const {
    title,
    externalUrl,
    make,
    model,
    carMakeLogoUrl,
    year,
    mileage,
    condition,
    description,
    priceSar,
    priceUsd,
    images
  } = req.body;

  const parseNum = (v) => {
    if (v === undefined || v === null || String(v).trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const sar = parseNum(priceSar);
  const usd = parseNum(priceUsd);
  // legacy: قيمة واحدة تُستخدم كمبدئية للسعر الحالي/الابتدائي
  const legacy = sar !== null ? sar : usd;
  if (legacy === null) return res.status(400).send('يرجى إدخال السعر (SAR) أو (USD) على الأقل.');

  const imagesArr = String(images || '')
    .split(/\r?\n/)
    .map((s) => String(s).trim())
    .filter(Boolean);

  // Use the provided logo URL if available
  const makeLogoUrl = String(carMakeLogoUrl || '').trim();

  const car = await Car.create({
    seller: req.session.user._id,
    listingType: 'auction',
    externalUrl: String(externalUrl || '').trim(),
    title: String(title || '').trim(),
    make: String(make || '').trim(),
    model: String(model || '').trim(),
    makeLogoUrl: makeLogoUrl,
    year: parseNum(year),
    mileage: parseNum(mileage),
    condition: condition || 'good',
    description: String(description || '').trim(),
    price: legacy,
    priceSar: sar,
    priceUsd: usd,
    images: imagesArr
  });

  const currency = sar !== null ? 'SAR' : 'USD';
  // مزاد افتراضي: يبدأ الآن وينتهي بعد 30 يوم (يمكن تعديله لاحقاً حسب متطلبات المشروع)
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const auction = await Auction.create({
    car: car._id,
    startingPrice: legacy,
    currentPrice: legacy,
    currency,
    startsAt,
    endsAt,
    status: 'running'
  });

  res.redirect(`/auctions/${auction._id}`);
});

router.get('/car/:carId', async (req, res) => {
  // تحويل إلى مزاد السيارة إذا وجد
  const auction = await Auction.findOne({ car: req.params.carId }).select('_id');
  if (!auction) return res.status(404).render('errors/404');
  res.redirect(`/auctions/${auction._id}`);
});

router.post('/:id/order', requireAuth, requireRole('admin'), async (req, res) => {
  // للأدمن: إنشاء طلب/فاتورة لعميل فاز بالمزاد (auctionWin)
  const auction = await Auction.findById(req.params.id).populate('car');
  if (!auction || !auction.car) return res.status(404).render('errors/404');

  const buyerName = String(req.body.buyerName || '').trim();
  if (!buyerName) return res.status(400).send('يرجى إدخال اسم العميل');

  const buyerNameKey = buyerName.toLowerCase();
  let buyer = await User.findOne({ buyerNameKey });
  if (!buyer) {
    // إنشاء حساب عميل جديد تلقائياً إن لم يكن موجوداً
    const randomPass = crypto.randomBytes(16).toString('hex');
    buyer = await User.create({
      name: buyerName,
      buyerNameKey,
      password: randomPass,
      role: 'buyer'
    });
  }

  const currency = auction.currency || ((auction.car.priceSar !== undefined && auction.car.priceSar !== null) ? 'SAR' : 'USD');
  const amount = Number(auction.currentPrice || 0);
  const unitSar = currency === 'SAR' ? amount : 0;
  const unitUsd = currency === 'USD' ? amount : 0;

  const year = new Date().getFullYear();
  const prefix = `HM-${year}-`;
  let orderNumber = '';
  for (let i = 0; i < 3; i++) {
    const seq = await Order.countDocuments({ orderNumber: new RegExp('^' + prefix) });
    orderNumber = `${prefix}${String(seq + 1).padStart(6, '0')}`;
    try {
      const order = await Order.create({
        orderNumber,
        buyer: buyer._id,
        items: [{
          itemType: 'auctionWin',
          refId: auction.car._id,
          titleSnapshot: auction.car.title,
          qty: 1,
          unitPriceSar: unitSar,
          unitPriceUsd: unitUsd
        }],
        pricing: {
          subTotalSar: unitSar,
          subTotalUsd: unitUsd,
          shippingSar: 0,
          shippingUsd: 0,
          grandTotalSar: unitSar,
          grandTotalUsd: unitUsd
        }
      });

      return res.redirect(`/orders/${order._id}/invoice`);
    } catch (err) {
      if (err && err.code === 11000) continue;
      throw err;
    }
  }

  return res.status(500).send('تعذر إنشاء رقم الطلب. حاول مرة أخرى.');
});

router.get('/create/:carId', requireAuth, requireRole('admin'), async (req, res) => {
  // عرض نموذج إنشاء مزاد لسيارة متجر (car) تم إنشاؤها من صفحة السيارات
  const car = await Car.findById(req.params.carId);
  res.render('auctions/detail', { car, auction: null, bids: [], creating: true });
});

router.post('/create/:carId', requireAuth, requireRole('admin'), async (req, res) => {
  // حفظ المزاد كـ scheduled حسب (startsAt/endsAt) من الفورم
  const { startingPrice, startsAt, endsAt } = req.body;
  const car = await Car.findById(req.params.carId);
  const currency = (car && car.priceSar !== undefined && car.priceSar !== null)
    ? 'SAR'
    : ((car && car.priceUsd !== undefined && car.priceUsd !== null) ? 'USD' : 'SAR');

  const auction = await Auction.create({
    car: req.params.carId,
    startingPrice,
    currentPrice: startingPrice,
    currency,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    status: 'scheduled'
  });

  // Send notification to all buyers about new auction
  const NotificationService = require('../services/NotificationService');
  await NotificationService.sendNewItemNotification(auction, 'auction');

  res.redirect(`/auctions/${auction._id}`);
});

router.get('/:id', async (req, res) => {
  // عرض تفاصيل المزاد + أحدث المزايدات + بناء رابط واتساب للاستفسار
  const auction = await Auction.findById(req.params.id).populate('car').populate('highestBidder');
  if (!auction) return res.status(404).send('Auction not found');
  if (auction.car && auction.car.isSold) return res.status(404).send('Auction not found');
  const bids = await Bid.find({ auction: auction._id }).populate('bidder').sort({ createdAt: -1 });
  // تحديث الحالة بناءً على الوقت
  const now = new Date();
  if (now < auction.startsAt) auction.status = 'scheduled';
  else if (now > auction.endsAt) auction.status = 'ended';
  else auction.status = 'running';
  await auction.save();

  const whatsappSetting = await SiteSetting.findOne({ key: 'customerWhatsAppNumber' });
  const raw = whatsappSetting ? String(whatsappSetting.value || '').trim() : '';
  const waNumber = raw.replace(/[^0-9]/g, '');

  const baseUrl = (process.env.BASE_URL && String(process.env.BASE_URL).trim())
    ? String(process.env.BASE_URL).trim().replace(/\/$/, '')
    : `${req.protocol}://${req.get('host')}`;

  const pageUrl = `${baseUrl}/auctions/${auction._id}`;
  let whatsappUrl = '';
  if (waNumber) {
    const lines = [
      'استفسار عن سيارة مزاد عبر HM CAR',
      `السيارة: ${auction.car?.title || ''}`,
      `السعر الحالي: ${Number(auction.currentPrice || 0).toLocaleString('en-US')} ${auction.currency || 'SAR'}`,
      auction.car?.externalUrl ? `رابط المزاد الخارجي: ${auction.car.externalUrl}` : '',
      `رابط السيارة داخل HM CAR: ${pageUrl}`
    ].filter(Boolean);
    whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  res.render('auctions/detail', { car: auction.car, auction, bids, creating: false, waNumber, whatsappUrl });
});

module.exports = router;