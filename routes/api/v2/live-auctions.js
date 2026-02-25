// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/live-auctions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const LiveAuction = require('../../../models/LiveAuction');
const AdvancedNotification = require('../../../models/AdvancedNotification');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/live-auctions - Get all live auction sessions
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) query.status = status;

        const sessions = await LiveAuction.find(query).sort({ startTime: -1, createdAt: -1 });
        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('Error fetching live auctions:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET /api/v2/live-auctions/:id - Get specific session details
router.get('/:id', async (req, res) => {
    try {
        const session = await LiveAuction.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, data: session });
    } catch (error) {
        console.error('Error fetching live auction session:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/live-auctions - Create a new session (Admin)
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        // In a real app, check if user is admin
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const session = new LiveAuction(req.body);
        await session.save();
        res.status(201).json({ success: true, data: session });
    } catch (error) {
        console.error('Error creating live auction session:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// PUT /api/v2/live-auctions/:id - Update session (Admin)
router.put('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const session = await LiveAuction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, data: session });
    } catch (error) {
        console.error('Error updating live auction session:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// DELETE /api/v2/live-auctions/:id - Delete session (Admin)
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const session = await LiveAuction.findByIdAndDelete(req.params.id);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error('Error deleting live auction session:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/live-auctions/:id/start - Start session and notify all (Admin)
router.post('/:id/start', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const session = await LiveAuction.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        session.status = 'live';
        session.startTime = new Date();
        await session.save();

        // Broadcast notification to all users
        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: '🔥 المزاد المباشر بدأ الآن!',
            message: `انضم إلينا الآن في مزاد: ${session.title}. السيارات معروضة حالياً!`,
            actionUrl: `/auctions/live/${session._id}`,
            priority: 'URGENT',
            channels: ['IN_APP', 'PUSH']
        });

        res.json({ success: true, message: 'Auction started and users notified' });
    } catch (error) {
        console.error('Error starting live auction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/v2/live-auctions/:id/end - End session (Admin)
router.post('/:id/end', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const session = await LiveAuction.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        session.status = 'ended';
        session.endTime = new Date();
        await session.save();

        // Broadcast notification to all users
        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: '🏁 انتهى المزاد المباشر',
            message: `شكراً لمشاركتكم. انتهى مزاد ${session.title} بنجاح. ترقبوا المزادات القادمة!`,
            actionUrl: '/auctions',
            priority: 'MEDIUM',
            channels: ['IN_APP']
        });

        res.json({ success: true, message: 'Auction ended' });
    } catch (error) {
        console.error('Error ending live auction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
