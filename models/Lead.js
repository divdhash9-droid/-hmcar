// [[ARABIC_HEADER]] هذا الملف (models/Lead.js) جزء من مشروع HM CAR

const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    model: { type: String, trim: true },
    category: { type: String, trim: true },
    query: { type: String, trim: true },
    source: { type: String, default: 'web', trim: true },
    status: {
        type: String,
        enum: ['new', 'contacted', 'closed'],
        default: 'new'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
