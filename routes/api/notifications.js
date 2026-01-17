// [[ARABIC_HEADER]] هذا الملف (routes/api/notifications.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserNotificationPreference = require('../models/UserNotificationPreference');

// @route   GET /api/notifications/preferences
// @desc    Get user notification preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
    try {
        let preferences = await UserNotificationPreference.findOne({ user: req.user.id });
        if (!preferences) {
            // Create default preferences if they don't exist
            preferences = new UserNotificationPreference({ user: req.user.id });
            await preferences.save();
        }
        res.json(preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/notifications/preferences
// @desc    Update user notification preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
    const {
        outbid, auctionEndingSoon, newBidOnWatched, auctionWon, auctionLost,
        newMessage, systemUpdates, promotions,
        emailNotifications, pushNotifications
    } = req.body;

    try {
        let preferences = await UserNotificationPreference.findOne({ user: req.user.id });
        if (!preferences) {
            return res.status(404).json({ msg: 'Preferences not found' });
        }

        // Update main preferences
        if (outbid !== undefined) preferences.outbid = outbid;
        if (auctionEndingSoon !== undefined) preferences.auctionEndingSoon = auctionEndingSoon;
        if (newBidOnWatched !== undefined) preferences.newBidOnWatched = newBidOnWatched;
        if (auctionWon !== undefined) preferences.auctionWon = auctionWon;
        if (auctionLost !== undefined) preferences.auctionLost = auctionLost;
        if (newMessage !== undefined) preferences.newMessage = newMessage;
        if (systemUpdates !== undefined) preferences.systemUpdates = systemUpdates;
        if (promotions !== undefined) preferences.promotions = promotions;

        // Update channel-specific preferences
        if (emailNotifications) {
            preferences.emailNotifications = { ...preferences.emailNotifications, ...emailNotifications };
        }
        if (pushNotifications) {
            preferences.pushNotifications = { ...preferences.pushNotifications, ...pushNotifications };
        }
        
        preferences.updatedAt = Date.now();

        await preferences.save();
        res.json(preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
