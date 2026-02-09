// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/auctions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Auction = require('../../../models/Auction');
const Car = require('../../../models/Car');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/auctions - قائمة المزادات
router.get('/', async (req, res) => {
    try {
        const { status, limit = 10 } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const auctions = await Auction.find(query)
            .populate('car')
            .populate('highestBidder', 'name email')
            .sort({ endsAt: 1 })
            .limit(Number(limit))
            .lean();

        res.json({
            success: true,
            data: auctions.map(a => ({
                id: a._id,
                status: a.status,
                currentBid: a.currentPrice || a.startingPrice,
                currency: a.currency || 'SAR',
                endsAt: a.endsAt,
                startsAt: a.startsAt,
                bidders: a.bidsCount || 0, // Assuming a virtual or field
                car: a.car ? {
                    id: a.car._id,
                    title: a.car.title,
                    make: a.car.make,
                    model: a.car.model,
                    images: a.car.images,
                    year: a.car.year,
                    price: a.car.price
                } : null
            }))
        });
    } catch (error) {
        console.error('API Auctions error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET /api/v2/auctions/:id - جلب مزاد محدد
router.get('/:id', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('car')
            .populate('highestBidder', 'name')
            .lean();

        if (!auction) {
            return res.status(404).json({ success: false, error: 'Auction not found' });
        }

        res.json({
            success: true,
            data: {
                id: auction._id,
                status: auction.status,
                currentBid: auction.currentPrice || auction.startingPrice,
                currency: auction.currency || 'SAR',
                endsAt: auction.endsAt,
                startsAt: auction.startsAt,
                bidders: auction.bidsCount || 0,
                highestBidder: auction.highestBidder ? auction.highestBidder.name : null,
                car: auction.car ? {
                    id: auction.car._id,
                    title: auction.car.title,
                    make: auction.car.make,
                    model: auction.car.model,
                    images: auction.car.images,
                    year: auction.car.year,
                    description: auction.car.description,
                    mileage: auction.car.mileage,
                    fuelType: auction.car.fuelType,
                    transmission: auction.car.transmission,
                    color: auction.car.color
                } : null
            }
        });
    } catch (error) {
        console.error('API Get Auction error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/auctions - إنشاء مزاد جديد (Auth required)
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const { carId, startPrice, startsAt, endsAt } = req.body;

        if (!carId || !startPrice || !startsAt || !endsAt) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: 'All fields (carId, startPrice, startsAt, endsAt) are required'
            });
        }

        // Verify car exists
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ success: false, error: 'Car not found' });
        }

        const auction = new Auction({
            car: carId,
            startingPrice: startPrice,
            currentPrice: startPrice,
            startsAt,
            endsAt,
            status: 'scheduled'
        });

        await auction.save();

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
            data: auction
        });
    } catch (error) {
        console.error('API Create Auction error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PUT /api/v2/auctions/:id - تحديث مزاد (Auth required)
router.put('/:id', requireAuthAPI, async (req, res) => {
    try {
        const { status, endsAt } = req.body;
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ success: false, error: 'Auction not found' });
        }

        if (status) auction.status = status;
        if (endsAt) auction.endsAt = endsAt;

        await auction.save();

        res.json({
            success: true,
            message: 'Auction updated successfully',
            data: auction
        });
    } catch (error) {
        console.error('API Update Auction error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// DELETE /api/v2/auctions/:id - حذف مزاد (Auth required)
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        const auction = await Auction.findByIdAndDelete(req.params.id);
        if (!auction) {
            return res.status(404).json({ success: false, error: 'Auction not found' });
        }
        res.json({ success: true, message: 'Auction deleted successfully' });
    } catch (error) {
        console.error('API Delete Auction error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/auctions/:id/bid - المزايدة (Auth required)
router.post('/:id/bid', requireAuthAPI, async (req, res) => {
    try {
        const { amount } = req.body;
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ success: false, error: 'Auction not found' });
        }

        if (auction.status !== 'running') {
            return res.status(400).json({ success: false, error: 'Auction is not active' });
        }

        const currentHighest = auction.currentPrice || auction.startingPrice;

        if (amount <= currentHighest) {
            return res.status(400).json({
                success: false,
                error: 'Bid too low',
                message: `Bid must be higher than ${currentHighest}`
            });
        }

        auction.currentPrice = amount;
        auction.highestBidder = req.user.userId;

        // Increase bid count (if schematic supports it, otherwise skip)
        // auction.bidsCount = (auction.bidsCount || 0) + 1;

        await auction.save();

        // Notify via Socket.io if available (optional enhancement)

        res.json({
            success: true,
            message: 'Bid placed successfully',
            data: {
                currentPrice: auction.currentPrice,
                highestBidder: req.user.userId
            }
        });
    } catch (error) {
        console.error('API Bid error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
