// [[ARABIC_HEADER]] هذا الملف (services/PaymentService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const UserNotification = require('../models/UserNotification');

class PaymentService {
  static async initiatePayment(orderId, paymentMethod, paymentDetails) {
    try {
      const order = await Order.findById(orderId).populate('user');
      if (!order) {
        throw new Error('الطلب غير موجود');
      }
      
      if (order.status === 'paid') {
        throw new Error('الطلب مدفوع بالفعل');
      }
      
      // Create payment record
      const payment = await Payment.create({
        order: orderId,
        user: order.user._id,
        amount: order.totalAmount,
        paymentMethod,
        paymentGateway: this.getGatewayForMethod(paymentMethod),
        paymentDetails: this.sanitizePaymentDetails(paymentDetails),
        billingAddress: paymentDetails.billingAddress,
        shippingAddress: order.shippingAddress
      });
      
      // Process payment based on method
      let gatewayResponse;
      switch (paymentMethod) {
        case 'credit_card':
        case 'debit_card':
          gatewayResponse = await this.processCardPayment(payment, paymentDetails);
          break;
        case 'bank_transfer':
          gatewayResponse = await this.processBankTransfer(payment);
          break;
        case 'apple_pay':
          gatewayResponse = await this.processApplePay(payment, paymentDetails);
          break;
        case 'google_pay':
          gatewayResponse = await this.processGooglePay(payment, paymentDetails);
          break;
        case 'cash_on_delivery':
          gatewayResponse = await this.processCashOnDelivery(payment);
          break;
        default:
          throw new Error('طريقة الدفع غير مدعومة');
      }
      
      // Update payment with gateway response
      payment.gatewayResponse = gatewayResponse;
      payment.gatewayTransactionId = gatewayResponse.transactionId;
      
      if (gatewayResponse.success) {
        await payment.markAsCompleted(gatewayResponse);
        await this.updateOrderStatus(order, 'paid');
        await this.sendPaymentConfirmation(order.user._id, order, payment);
      } else {
        await payment.markAsFailed(gatewayResponse.error, gatewayResponse);
      }
      
      return payment;
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    }
  }
  
  static async processCardPayment(payment, paymentDetails) {
    // Simulate card payment processing
    // In production, integrate with actual payment gateway (Stripe, Mada, etc.)
    
    const cardNumber = paymentDetails.cardNumber;
    const expiry = paymentDetails.expiry;
    const cvv = paymentDetails.cvv;
    const cardholderName = paymentDetails.cardholderName;
    
    // Validate card details
    if (!this.validateCard(cardNumber, expiry, cvv)) {
      return {
        success: false,
        error: 'بيانات البطاقة غير صالحة',
        transactionId: null
      };
    }
    
    // Simulate gateway processing
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;
    
    return {
      success: isSuccess,
      transactionId: isSuccess ? transactionId : null,
      error: isSuccess ? null : 'فشل في معالجة البطاقة',
      cardLastFour: cardNumber.slice(-4),
      cardBrand: this.detectCardBrand(cardNumber)
    };
  }
  
  static async processBankTransfer(payment) {
    // Generate bank transfer details
    const transferReference = `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return {
      success: true,
      transactionId: transferReference,
      requiresManualConfirmation: true,
      bankDetails: {
        accountName: 'HM CAR Auction',
        accountNumber: 'SA1234567890123456',
        bankName: 'Riyad Bank',
        iban: 'SA8910000001234567890123',
        reference: transferReference
      }
    };
  }
  
  static async processApplePay(payment, paymentDetails) {
    // Simulate Apple Pay processing
    const transactionId = `AP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      transactionId,
      paymentMethod: 'Apple Pay'
    };
  }
  
  static async processGooglePay(payment, paymentDetails) {
    // Simulate Google Pay processing
    const transactionId = `GP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      transactionId,
      paymentMethod: 'Google Pay'
    };
  }
  
  static async processCashOnDelivery(payment) {
    // Cash on delivery doesn't require immediate payment
    return {
      success: true,
      transactionId: `COD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod: 'Cash on Delivery',
      requiresManualConfirmation: true
    };
  }
  
  static async processRefund(paymentId, refundAmount, reason) {
    try {
      const payment = await Payment.processRefund(paymentId, refundAmount, reason);
      
      // Process refund through gateway
      const gatewayResponse = await this.refundThroughGateway(payment, refundAmount);
      
      if (gatewayResponse.success) {
        // Update refund status
        const refund = payment.refunds[payment.refunds.length - 1];
        refund.status = 'completed';
        refund.processedAt = new Date();
        refund.gatewayRefundId = gatewayResponse.refundId;
        
        await payment.save();
        
        // Update order status if fully refunded
        const totalRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
        if (totalRefunded >= payment.amount) {
          await Order.findByIdAndUpdate(payment.order, { status: 'refunded' });
        }
        
        await this.sendRefundConfirmation(payment.user, payment, refundAmount);
      }
      
      return payment;
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }
  
  static async refundThroughGateway(payment, amount) {
    // Simulate refund processing
    const refundId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      refundId,
      amount,
      processedAt: new Date()
    };
  }
  
  static async createInstallmentPlan(paymentId, totalInstallments, installmentAmount) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('الدفعة غير موجودة');
      }
      
      payment.installmentPlan = {
        isInstallment: true,
        totalInstallments,
        currentInstallment: 0,
        installmentAmount,
        nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paidInstallments: []
      };
      
      await payment.save();
      return payment;
    } catch (error) {
      console.error('Installment plan creation error:', error);
      throw error;
    }
  }
  
  static async processInstallmentPayment(paymentId, amount) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('الدفعة غير موجودة');
      }
      
      await payment.processInstallment(amount);
      
      // Send installment confirmation
      await this.sendInstallmentConfirmation(payment.user, payment, amount);
      
      return payment;
    } catch (error) {
      console.error('Installment processing error:', error);
      throw error;
    }
  }
  
  static async getPaymentStatus(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('order')
        .populate('user');
      
      if (!payment) {
        throw new Error('الدفعة غير موجودة');
      }
      
      return {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        order: payment.order,
        refunds: payment.refunds,
        installmentPlan: payment.installmentPlan
      };
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  }
  
  // Helper methods
  static getGatewayForMethod(paymentMethod) {
    const gatewayMap = {
      'credit_card': 'stripe',
      'debit_card': 'stripe',
      'apple_pay': 'stripe',
      'google_pay': 'stripe',
      'bank_transfer': 'manual',
      'cash_on_delivery': 'manual'
    };
    return gatewayMap[paymentMethod] || 'manual';
  }
  
  static sanitizePaymentDetails(details) {
    const sanitized = { ...details };
    
    // Remove sensitive data from logs
    if (sanitized.cardNumber) {
      sanitized.cardLastFour = sanitized.cardNumber.slice(-4);
      delete sanitized.cardNumber;
    }
    delete sanitized.cvv;
    
    return sanitized;
  }
  
  static validateCard(cardNumber, expiry, cvv) {
    // Basic validation (in production, use proper validation library)
    const cardRegex = /^\d{16}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;
    
    return cardRegex.test(cardNumber.replace(/\s/g, '')) &&
           expiryRegex.test(expiry) &&
           cvvRegex.test(cvv);
  }
  
  static detectCardBrand(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    if (number.startsWith('6')) return 'Discover';
    
    return 'Unknown';
  }
  
  static async updateOrderStatus(order, status) {
    order.status = status;
    order.paidAt = new Date();
    await order.save();
  }
  
  static async sendPaymentConfirmation(userId, order, payment) {
    await UserNotification.createNotification({
      user: userId,
      title: 'تأكيد الدفع',
      message: `تم استلام دفعك بنجاح لطلب #${order.orderNumber} بمبلغ ${payment.amount} ${payment.currency}`,
      type: 'success',
      relatedTo: order._id,
      relatedToModel: 'Order',
      actionUrl: `/orders/${order._id}`,
      actionText: 'عرض الطلب'
    });
  }
  
  static async sendRefundConfirmation(userId, payment, refundAmount) {
    await UserNotification.createNotification({
      user: userId,
      title: 'تأكيد الاسترداد',
      message: `تم استرداد مبلغ ${refundAmount} ${payment.currency} بنجاح`,
      type: 'success',
      relatedTo: payment.order,
      relatedToModel: 'Order',
      actionUrl: `/orders/${payment.order}`,
      actionText: 'عرض الطلب'
    });
  }
  
  static async sendInstallmentConfirmation(userId, payment, amount) {
    await UserNotification.createNotification({
      user: userId,
      title: 'تأكيد القسط',
      message: `تم استلام القسط الشهري بمبلغ ${amount} ${payment.currency}`,
      type: 'success',
      relatedTo: payment.order,
      relatedToModel: 'Order',
      actionUrl: `/orders/${payment.order}`,
      actionText: 'عرض الطلب'
    });
  }
}

module.exports = PaymentService;
