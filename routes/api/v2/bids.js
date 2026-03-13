// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/bids.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Bid = require('../../../models/Bid');
const Auction = require('../../../models/Auction');
const SiteSettings = require('../../../models/SiteSettings');
const { requireAuthAPI } = require('../../../middleware/auth');

function normalizeMultiplier(value) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : 1;
}

function applyMultiplier(amount, multiplier) {
    const safeAmount = Number(amount || 0);
    return Number((safeAmount * multiplier).toFixed(2));
}

function toBaseAmount(amount, multiplier) {
    const safeAmount = Number(amount || 0);
    return Number((safeAmount / multiplier).toFixed(2));
}

// الحصول على جميع مزايدات المستخدم
router.get('/my', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const bids = await Bid.find({ bidder: userId })
            .populate({
                path: 'auction',
                populate: { path: 'car', select: 'title make model year images' }
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bids.map(b => ({
                id: b._id,
                amount: applyMultiplier(b.amount, auctionMultiplier),
                auction: b.auction,
                status: b.status || 'active',
                createdAt: b.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب المزايدات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المزايدات' });
    }
});

// الحصول على مزايدات مزاد معين
router.get('/auction/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const bids = await Bid.find({ auction: auctionId })
            .populate('bidder', 'name')
            .sort({ amount: -1 })
            .limit(limit);

        res.json({
            success: true,
            data: bids.map(b => ({
                id: b._id,
                amount: applyMultiplier(b.amount, auctionMultiplier),
                bidder: {
                    id: b.bidder._id,
                    name: b.bidder.name ? b.bidder.name.charAt(0) + '***' : 'مجهول'
                },
                createdAt: b.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب مزايدات المزاد:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المزايدات' });
    }
});

// إضافة مزايدة جديدة
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { auctionId, amount } = req.body;

        if (!auctionId || !amount) {
            return res.status(400).json({ success: false, error: 'معرف المزاد والمبلغ مطلوبان' });
        }

        // التحقق من وجود المزاد
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ success: false, error: 'المزاد غير موجود' });
        }

        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);
        const baseAmount = toBaseAmount(amount, auctionMultiplier);

        // التحقق من أن المزاد نشط
        if (auction.status !== 'active' && auction.status !== 'running') {
            return res.status(400).json({ success: false, error: 'المزاد غير نشط' });
        }

        // التحقق من أن المزاد لم ينتهِ
        if (new Date() > new Date(auction.endTime)) {
            return res.status(400).json({ success: false, error: 'انتهى وقت المزاد' });
        }

        // التحقق من أن المبلغ أعلى من السعر الحالي
        const minBid = auction.currentPrice + (auction.minBidIncrement || 100);
        if (baseAmount < minBid) {
            return res.status(400).json({
                success: false,
                error: `المبلغ يجب أن يكون أعلى من ${applyMultiplier(minBid, auctionMultiplier)}`
            });
        }

        // إنشاء المزايدة
        const bid = await Bid.create({
            auction: auctionId,
            bidder: userId,
            amount: baseAmount
        });

        // تحديث سعر المزاد الحالي
        auction.currentPrice = baseAmount;
        auction.highestBidder = userId;
        await auction.save();

        res.status(201).json({
            success: true,
            message: 'تم تقديم المزايدة بنجاح',
            data: {
                id: bid._id,
                amount: applyMultiplier(bid.amount, auctionMultiplier),
                newCurrentPrice: applyMultiplier(auction.currentPrice, auctionMultiplier)
            }
        });
    } catch (error) {
        console.error('خطأ في تقديم المزايدة:', error);
        res.status(500).json({ success: false, error: 'فشل في تقديم المزايدة' });
    }
});

// الحصول على أعلى مزايدة لمزاد
router.get('/highest/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;

        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const highestBid = await Bid.findOne({ auction: auctionId })
            .sort({ amount: -1 })
            .populate('bidder', 'name');

        if (!highestBid) {
            return res.json({
                success: true,
                data: null,
                message: 'لا توجد مزايدات بعد'
            });
        }

        res.json({
            success: true,
            data: {
                id: highestBid._id,
                amount: applyMultiplier(highestBid.amount, auctionMultiplier),
                bidder: highestBid.bidder.name ? highestBid.bidder.name.charAt(0) + '***' : 'مجهول',
                createdAt: highestBid.createdAt
            }
        });
    } catch (error) {
        console.error('خطأ في جلب أعلى مزايدة:', error);
        res.status(500).json({ success: false, error: 'فشل في الجلب' });
    }
});

module.exports = router;
