const mongoose = require('mongoose');

const liveAuctionCarSchema = new mongoose.Schema({
    title: { type: String, required: true },
    images: [String],
    condition: { type: String, default: '' }, // 'damaged', 'clean', etc.
    description: { type: String, default: '' }, // Details like 'The problem is ...'
    priceEstimate: { type: String, default: '' }, // Maybe a price or range
    lotNumber: { type: String, default: '' },
    auctionName: { type: String, default: '' }, // e.g. 'Copart'
});

const liveAuctionSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g. 'Monday IAAI Live Session'
    externalUrl: { type: String, default: '' }, // The iframe/external link
    status: {
        type: String,
        enum: ['upcoming', 'live', 'ended'],
        default: 'upcoming'
    },
    cars: [liveAuctionCarSchema],
    startTime: { type: Date },
    endTime: { type: Date },
    whatsappNumber: { type: String, default: '' }, // Custom WA for this auction
    messageTemplate: { type: String, default: '' } // Template for WA message
}, { timestamps: true });

module.exports = mongoose.model('LiveAuction', liveAuctionSchema);
