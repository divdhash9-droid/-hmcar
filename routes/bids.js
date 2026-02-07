// [[ARABIC_HEADER]] هذا الملف (routes/bids.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// routes/bids.js
// مسارات المزايدات (Bids): حالياً إضافة مزايدة يدوياً من الإدارة فقط
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');

router.post('/:auctionId', requireAuth, requireRole('buyer', 'admin'), async (req, res) => {
  // إضافة مزايدة: مسموح للـ buyer و الـ admin
  const { amount, bidderName } = req.body;
  const { user } = req.session;
  
  const auction = await Auction.findById(req.params.auctionId).populate('car');
  const now = new Date();

  // التحقق من وجود المزاد
  if (!auction) return res.status(404).send('Auction not found');
  // التحقق من حالة السيارة (مباعة أم لا)
  if (auction.car && auction.car.isSold) return res.status(400).send('هذه السيارة تم بيعها بالفعل');
  // التحقق من موعد بدء المزاد
  if (now < auction.startsAt) return res.status(400).send('المزاد لم يبدأ بعد');
  // التحقق من موعد انتهاء المزاد
  if (now > auction.endsAt || auction.status === 'ended') return res.status(400).send('المزاد منتهي');

  const current = Number(auction.currentPrice) || 0;
  const start = Number(auction.startingPrice) || 0;
  const minNext = Math.max(current, start) + 1;

  // التحقق من صلاحية المزايدة
  if (Number(amount) < minNext) {
    return res.status(400).send(`الحد الأدنى للمزايدة هو ${minNext}`);
  }

  // حفظ المزايد السابق (قبل التحديث) لإرسال إشعار له لاحقاً
  const previousBidderId = auction.highestBidder;

  let finalBidderName = '';
  if (user.role === 'admin') {
    finalBidderName = String(bidderName || user.name).trim();
  } else {
    finalBidderName = user.name;
  }

  // إنشاء مزايدة جديدة
  const bid = await Bid.create({
    auction: auction._id,
    bidder: user._id,
    displayName: finalBidderName,
    amount: Number(amount)
  });

  // تحديث حالة المزاد (السعر الحالي + أعلى مزايد)
  auction.currentPrice = bid.amount;
  auction.highestBidder = user._id;
  await auction.save();

  // إرسال تحديث عبر socket إلى المشاهدين المباشرين للمزاد
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`auction_${auction._id}`).emit('bid:placed', {
        auctionId: String(auction._id),
        amount: bid.amount,
        currency: auction.currency || 'SAR',
        bidder: { _id: String(user._id), name: finalBidderName }
      });
    }
  } catch (e) {
    console.error('Socket emit error:', e);
  }

  // ميزة جديدة: إرسال إشعار للمستخدم السابق (Outbid Notification) عبر Firebase
  // يتم التنفيذ فقط إذا كان هناك مزايد سابق وهو ليس نفس المستخدم الحالي
  if (previousBidderId && String(previousBidderId) !== String(user._id)) {
    try {
      const prevUser = await User.findById(previousBidderId).select('fcmToken');
      const admin = req.app.get('firebaseAdmin');
      
      // نتأكد من وجود توكن للجهاز (fcmToken) وأن Firebase متصل
      if (prevUser && prevUser.fcmToken && admin) {
        await admin.messaging().send({
          token: prevUser.fcmToken,
          notification: {
            title: '⚠️ تمت المزايدة عليك!',
            body: `قام شخص آخر برفع السعر في المزاد على: ${auction.car.title || 'السيارة'}`
          },
          data: { auctionId: String(auction._id) }
        });
      }
    } catch (err) {
      console.error('Firebase Notification Error:', err.message);
    }
  }

  res.redirect(`/auctions/${auction._id}`);
});

module.exports = router;