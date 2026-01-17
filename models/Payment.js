// [[ARABIC_HEADER]] هذا الملف (models/Payment.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'SAR',
    enum: ['SAR', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery', 'apple_pay', 'google_pay'],
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'mada', 'stcpay', 'manual'],
    required: true
  },
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  failureReason: String,
  paymentDetails: {
    cardLastFour: String,
    cardBrand: String,
    cardExpMonth: String,
    cardExpYear: String,
    bankName: String,
    accountNumber: String,
    transferReference: String
  },
  billingAddress: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    country: String,
    postalCode: String
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    postalCode: String
  },
  metadata: {
    ip: String,
    userAgent: String,
    sessionId: String
  },
  refunds: [{
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    processedAt: Date,
    gatewayRefundId: String
  }],
  installmentPlan: {
    isInstallment: { type: Boolean, default: false },
    totalInstallments: Number,
    currentInstallment: { type: Number, default: 0 },
    installmentAmount: Number,
    nextPaymentDue: Date,
    paidInstallments: [{
      amount: Number,
      paidAt: Date,
      transactionId: String
    }]
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ gatewayTransactionId: 1 });

// Static methods
paymentSchema.statics.createPayment = async function(paymentData) {
  const payment = new this(paymentData);
  await payment.save();
  return payment;
};

paymentSchema.statics.processRefund = async function(paymentId, refundAmount, reason) {
  const payment = await this.findById(paymentId);
  if (!payment) {
    throw new Error('الدفعة غير موجودة');
  }
  
  if (payment.status !== 'completed') {
    throw new Error('يمكن استرداد الدفعات المكتملة فقط');
  }
  
  const totalRefunded = payment.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  if (totalRefunded + refundAmount > payment.amount) {
    throw new Error('مبلغ الاسترداد يتجاوز مبلغ الدفع الأصلي');
  }
  
  payment.refunds.push({
    amount: refundAmount,
    reason,
    status: 'pending'
  });
  
  await payment.save();
  return payment;
};

// Instance methods
paymentSchema.methods.markAsCompleted = async function(gatewayResponse) {
  this.status = 'completed';
  this.gatewayResponse = gatewayResponse;
  return await this.save();
};

paymentSchema.methods.markAsFailed = async function(failureReason, gatewayResponse) {
  this.status = 'failed';
  this.failureReason = failureReason;
  this.gatewayResponse = gatewayResponse;
  return await this.save();
};

paymentSchema.methods.processInstallment = async function(amount) {
  if (!this.installmentPlan.isInstallment) {
    throw new Error('هذه الدفعة ليست خطة تقسيط');
  }
  
  this.installmentPlan.paidInstallments.push({
    amount,
    paidAt: new Date(),
    transactionId: this.gatewayTransactionId
  });
  
  this.installmentPlan.currentInstallment += 1;
  
  if (this.installmentPlan.currentInstallment >= this.installmentPlan.totalInstallments) {
    this.status = 'completed';
  } else {
    // Calculate next payment due date (e.g., 30 days from now)
    this.installmentPlan.nextPaymentDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  return await this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
