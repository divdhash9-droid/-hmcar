const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const PaymentService = require('../services/PaymentService');
const { requireAuthAPI } = require('../middleware/auth');

// Initiate payment
router.post('/initiate', requireAuthAPI, async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;
    
    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'معرّف الطلب وطريقة الدفع مطلوبان' });
    }
    
    const payment = await PaymentService.initiatePayment(orderId, paymentMethod, paymentDetails);
    
    res.status(201).json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        gatewayResponse: payment.gatewayResponse
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment status
router.get('/:paymentId/status', requireAuthAPI, async (req, res) => {
  try {
    const paymentStatus = await PaymentService.getPaymentStatus(req.params.paymentId);
    
    res.json({
      success: true,
      payment: paymentStatus
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process refund
router.post('/:paymentId/refund', requireAuthAPI, async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    
    if (!refundAmount || !reason) {
      return res.status(400).json({ error: 'مبلغ الاسترداد والسبب مطلوبان' });
    }
    
    const payment = await PaymentService.processRefund(req.params.paymentId, refundAmount, reason);
    
    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        refunds: payment.refunds
      }
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create installment plan
router.post('/:paymentId/installments', requireAuthAPI, async (req, res) => {
  try {
    const { totalInstallments, installmentAmount } = req.body;
    
    if (!totalInstallments || !installmentAmount) {
      return res.status(400).json({ error: 'عدد الأقساط ومبلغ القسط مطلوبان' });
    }
    
    const payment = await PaymentService.createInstallmentPlan(req.params.paymentId, totalInstallments, installmentAmount);
    
    res.json({
      success: true,
      payment: {
        id: payment._id,
        installmentPlan: payment.installmentPlan
      }
    });
  } catch (error) {
    console.error('Installment plan creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process installment payment
router.post('/:paymentId/installments/pay', requireAuthAPI, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'مبلغ القسط مطلوب' });
    }
    
    const payment = await PaymentService.processInstallmentPayment(req.params.paymentId, amount);
    
    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        installmentPlan: payment.installmentPlan
      }
    });
  } catch (error) {
    console.error('Installment payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user payment history
router.get('/history', requireAuthAPI, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    
    const payments = await Payment.find(filter)
      .populate('order')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(filter);
    
    res.json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment methods
router.get('/methods', requireAuthAPI, async (req, res) => {
  try {
    const methods = [
      {
        id: 'credit_card',
        name: 'بطاقة ائتمان',
        icon: 'credit-card',
        supported: true,
        fees: 0.029, // 2.9%
        currencies: ['SAR', 'USD']
      },
      {
        id: 'debit_card',
        name: 'بطاقة خصم مباشر',
        icon: 'credit-card',
        supported: true,
        fees: 0.029,
        currencies: ['SAR', 'USD']
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        icon: 'apple',
        supported: true,
        fees: 0.029,
        currencies: ['SAR', 'USD']
      },
      {
        id: 'google_pay',
        name: 'Google Pay',
        icon: 'google',
        supported: true,
        fees: 0.029,
        currencies: ['SAR', 'USD']
      },
      {
        id: 'bank_transfer',
        name: 'تحويل بنكي',
        icon: 'university',
        supported: true,
        fees: 0,
        currencies: ['SAR', 'USD']
      },
      {
        id: 'cash_on_delivery',
        name: 'الدفع عند الاستلام',
        icon: 'truck',
        supported: true,
        fees: 0,
        currencies: ['SAR']
      }
    ];
    
    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate payment method
router.post('/validate', requireAuthAPI, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails } = req.body;
    
    let isValid = false;
    let errors = [];
    
    switch (paymentMethod) {
      case 'credit_card':
      case 'debit_card':
        isValid = validateCardDetails(paymentDetails, errors);
        break;
      case 'bank_transfer':
        isValid = validateBankTransferDetails(paymentDetails, errors);
        break;
      case 'apple_pay':
      case 'google_pay':
        isValid = validateDigitalWalletDetails(paymentDetails, errors);
        break;
      case 'cash_on_delivery':
        isValid = true; // No validation needed for COD
        break;
      default:
        errors.push('طريقة الدفع غير مدعومة');
    }
    
    res.json({
      success: isValid,
      errors
    });
  } catch (error) {
    console.error('Payment validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook for payment gateway callbacks
router.post('/webhook/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const webhookData = req.body;
    
    // Verify webhook signature (in production)
    // const isValidSignature = verifyWebhookSignature(req, webhookData);
    // if (!isValidSignature) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }
    
    // Process webhook based on gateway
    let result;
    switch (gateway) {
      case 'stripe':
        result = await processStripeWebhook(webhookData);
        break;
      case 'paypal':
        result = await processPaypalWebhook(webhookData);
        break;
      case 'mada':
        result = await processMadaWebhook(webhookData);
        break;
      default:
        result = { success: false, error: 'Gateway not supported' };
    }
    
    if (result.success) {
      res.status(200).json({ received: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function validateCardDetails(details, errors) {
  const required = ['cardNumber', 'expiry', 'cvv', 'cardholderName'];
  
  for (const field of required) {
    if (!details[field]) {
      errors.push(`${field} مطلوب`);
    }
  }
  
  if (details.cardNumber && !/^\d{16}$/.test(details.cardNumber.replace(/\s/g, ''))) {
    errors.push('رقم البطاقة غير صالح');
  }
  
  if (details.expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(details.expiry)) {
    errors.push('تاريخ الانتهاء غير صالح');
  }
  
  if (details.cvv && !/^\d{3,4}$/.test(details.cvv)) {
    errors.push('رمز الأمان غير صالح');
  }
  
  return errors.length === 0;
}

function validateBankTransferDetails(details, errors) {
  if (!details.transferReference) {
    errors.push('رقم التحويل مطلوب');
  }
  
  if (!details.transferDate) {
    errors.push('تاريخ التحويل مطلوب');
  }
  
  if (!details.bankName) {
    errors.push('اسم البنك مطلوب');
  }
  
  return errors.length === 0;
}

function validateDigitalWalletDetails(details, errors) {
  if (!details.token) {
    errors.push('توكن الدفع مطلوب');
  }
  
  if (!details.merchantId) {
    errors.push('معرّف التاجر مطلوب');
  }
  
  return errors.length === 0;
}

async function processStripeWebhook(data) {
  // Process Stripe webhook
  console.log('Stripe webhook:', data);
  return { success: true };
}

async function processPaypalWebhook(data) {
  // Process PayPal webhook
  console.log('PayPal webhook:', data);
  return { success: true };
}

async function processMadaWebhook(data) {
  // Process Mada webhook
  console.log('Mada webhook:', data);
  return { success: true };
}

module.exports = router;
