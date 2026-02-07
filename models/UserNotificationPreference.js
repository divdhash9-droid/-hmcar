// [[ARABIC_HEADER]] هذا الملف (models/UserNotificationPreference.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * UserNotificationPreference Schema
 * Defines how users can customize the notifications they receive.
 */
const UserNotificationPreferenceSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    // Bid and Auction Notifications
    outbid: { type: Boolean, default: true }, // Notify when outbid
    auctionEndingSoon: { type: Boolean, default: true }, // Notify when a watched auction is ending soon
    newBidOnWatched: { type: Boolean, default: true }, // Notify on new bids for a watched auction
    auctionWon: { type: Boolean, default: true }, // Notify when an auction is won
    auctionLost: { type: Boolean, default: true }, // Notify when an auction is lost

    // Message Notifications
    newMessage: { type: Boolean, default: true }, // Notify on new private messages

    // General Notifications
    systemUpdates: { type: Boolean, default: true }, // Important updates from the platform
    promotions: { type: Boolean, default: false }, // Marketing and promotional content

    // Delivery Channels
    emailNotifications: {
        outbid: { type: Boolean, default: false },
        auctionWon: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
    },
    pushNotifications: {
        outbid: { type: Boolean, default: true },
        newMessage: { type: Boolean, default: true },
        auctionEndingSoon: { type: Boolean, default: true },
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

UserNotificationPreferenceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UserNotificationPreference', UserNotificationPreferenceSchema);
