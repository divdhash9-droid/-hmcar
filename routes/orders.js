const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const Order = require('../models/Order');
const SiteSetting = require('../models/SiteSetting');
const SparePart = require('../models/SparePart');
const Car = require('../models/Car');

// مسارات الطلبات (Orders):
// - GET  /orders/:id/invoice   عرض الفاتورة (لصاحب الطلب أو للأدمن)
// - POST /orders/:id/status    تغيير حالة الطلب (للأدمن) + تنفيذ منطق التأكيد (بيع السيارة/خصم مخزون القطع)

router.get('/my', requireAuth, requireRole('buyer'), async (req, res) => {
  // قائمة طلباتي/فواتيري للعميل (buyer)
  const user = req.session.user;
  const orders = await Order.find({ buyer: user._id }).sort({ createdAt: -1 });
  res.render('orders/my', { orders });
});

router.get('/:id/invoice', requireAuth, async (req, res) => {
  // عرض فاتورة الطلب: مسموح لصاحب الطلب أو للأدمن فقط
  const order = await Order.findById(req.params.id).populate('buyer', 'name role');
  if (!order) return res.status(404).render('errors/404');

  const user = req.session.user;
  if (!user) return res.redirect('/auth/login');

  // السماح بعرض الفاتورة لصاحب الطلب فقط، أو للأدمن
  if (user.role !== 'admin' && String(order.buyer?._id || order.buyer) !== String(user._id)) {
    return res.status(403).send('Forbidden');
  }

  const whatsappSetting = await SiteSetting.findOne({ key: 'customerWhatsAppNumber' });
  const raw = whatsappSetting ? String(whatsappSetting.value || '').trim() : '';
  const waNumber = raw.replace(/[^0-9]/g, '');

  const baseUrl = (process.env.BASE_URL && String(process.env.BASE_URL).trim())
    ? String(process.env.BASE_URL).trim().replace(/\/$/, '')
    : `${req.protocol}://${req.get('host')}`;

  const invoiceUrl = `${baseUrl}/orders/${order._id}/invoice`;

  const spareIds = (order.items || [])
    .filter((it) => it.itemType === 'sparePart' && it.refId)
    .map((it) => String(it.refId));
  const spareParts = spareIds.length
    ? await SparePart.find({ _id: { $in: spareIds } }).select('name images')
    : [];
  const spareMap = new Map(spareParts.map((p) => [String(p._id), p]));

  const spareLinks = spareIds
    .map((id) => ({ id, part: spareMap.get(String(id)) }))
    .filter((x) => x.part)
    .map((x) => ({
      id: x.id,
      name: x.part.name,
      imageUrl: (x.part.images && x.part.images[0]) ? x.part.images[0] : '',
      url: `${baseUrl}/spare-parts/part/${x.id}`
    }));

  // تجهيز رابط واتساب برسالة تحتوي رقم الطلب + الإجمالي + رابط الفاتورة
  // الهدف: تسهيل إرسال رابط الفاتورة وبيانات الطلب لخدمة العملاء/الإدارة
  let whatsappUrl = '';
  if (waNumber) {
    const lines = [
      'طلب جديد عبر HM CAR',
      `رقم الطلب: ${order.orderNumber}`,
      `العميل: ${order.buyer?.name || ''}`,
      `الإجمالي: ${Number(order.pricing?.grandTotalSar || 0).toLocaleString('en-US')} SAR | ${Number(order.pricing?.grandTotalUsd || 0).toLocaleString('en-US')} USD`,
      `رابط الفاتورة: ${invoiceUrl}`,
      '',
      ...(spareLinks.length ? ['روابط القطع:'] : []),
      ...spareLinks.map((p) => `${p.name}: ${p.url}`),
      '',
      order.meta?.pendingSaleConfirmUrl ? `رابط تأكيد البيع (للأدمن): ${order.meta.pendingSaleConfirmUrl}` : ''
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    whatsappUrl = `https://wa.me/${waNumber}?text=${text}`;
  }

  const openWhatsApp = String(req.query.openWhatsApp || '').trim() === '1';
  res.render('orders/invoice', { order, invoiceUrl, whatsappUrl, waNumber, spareLinks, openWhatsApp });
});

router.post('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // تغيير حالة الطلب من لوحة الإدارة (confirmed/cancelled/completed)
    // عند confirmed:
    // - السيارات: يتم وضعها كمباعة وإخفاؤها من القوائم
    // - قطع الغيار: يتم خصم المخزون مرة واحدة
    // ملاحظة: نستخدم order.meta.inventoryDeducted لمنع خصم المخزون أكثر من مرة
    const nextStatus = String(req.body.status || '').trim();
    if (!['confirmed', 'cancelled', 'completed'].includes(nextStatus)) {
      return res.status(400).send('Invalid status');
    }

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).render('errors/404');
    }

    const prevStatus = String(order.status || '');
    const adminId = (req.session && req.session.user && req.session.user._id) ? req.session.user._id : null;

    if (prevStatus !== nextStatus) {
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.statusHistory.push({ from: prevStatus, to: nextStatus, by: adminId, at: new Date() });
    }

    if (nextStatus === 'confirmed') {
      // عند التأكيد: نتحقق أولاً أن السيارات غير مباعة لعميل آخر ثم نضعها كمباعة
      const carItems = (order.items || []).filter((it) => it.itemType === 'car' || it.itemType === 'auctionWin');

      for (const it of carItems) {
        const car = await Car.findById(it.refId).session(session);
        if (!car) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).send('السيارة غير موجودة.');
        }
        if (car.isSold && String(car.soldTo || '') !== String(order.buyer || '')) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).send('هذه السيارة تم بيعها بالفعل لعميل آخر.');
        }
      }

      for (const it of carItems) {
        const car = await Car.findById(it.refId).session(session);
        if (!car) continue;
        if (!car.isSold) {
          car.isSold = true;
          car.soldTo = order.buyer || null;
          car.soldAt = new Date();
          car.pendingSaleToken = '';
          car.pendingSaleBuyer = null;
          car.pendingSaleAt = null;
          await car.save({ session });
        }
      }
    }

    // خصم مخزون قطع الغيار عند confirmed (مرة واحدة فقط)
    if (nextStatus === 'confirmed' && !order.meta?.inventoryDeducted) {
      const spareItems = (order.items || []).filter((it) => it.itemType === 'sparePart');

      for (const it of spareItems) {
        const qty = Math.max(Number(it.qty || 1), 1);
        const part = await SparePart.findById(it.refId).session(session);
        if (!part) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).send('قطعة غير موجودة في المخزون');
        }

        const available = Number(part.stockQty || 0);
        if (available < qty) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).send('الكمية غير كافية في المخزون لتأكيد الطلب');
        }
      }

      for (const it of spareItems) {
        const qty = Math.max(Number(it.qty || 1), 1);
        const part = await SparePart.findById(it.refId).session(session);
        if (part) { // Check if part exists before updating
            part.stockQty = Math.max(Number(part.stockQty || 0) - qty, 0);
            if (part.stockQty <= 0) part.inStock = false;
            await part.save({ session });
        }
      }

      order.meta.inventoryDeducted = true;
    }

    order.status = nextStatus;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.redirect(`/orders/${order._id}/invoice`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error); // Pass error to the global error handler
  }
});

module.exports = router;
