// [[ARABIC_HEADER]] هذا الملف (models/Invoice.js) جزء من مشروع HM CAR لإنشاء فواتير مخصصة من قبل الأدمن.

const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  unitPriceKrw: { type: Number, default: 0 },
  unitPriceUsd: { type: Number, default: 0 },
  unitPriceSar: { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String },
  buyerAddress: { type: String },
  items: [invoiceItemSchema],
  totalKrw: { type: Number, default: 0 },
  totalUsd: { type: Number, default: 0 },
  totalSar: { type: Number, default: 0 },
  currencySnapshot: {
    usdToSar: { type: Number, default: 3.75 },
    usdToKrw: { type: Number, default: 1350 },
  },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
  notes: { type: String },
  destination: { type: String, default: 'DAMMAM, SAUDI ARABIA' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invoiceDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
