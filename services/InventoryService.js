// [[ARABIC_HEADER]] هذا الملف (services/InventoryService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[خدمة إدارة المخزون]] - services/InventoryService.js
 * 
 * هذه الخدمة تدير مخزون السيارات وقطع الغيار
 * - تتبع المخزون
 * - تحديث الكميات
 * - التحقق من التوفر
 * - حجز وإطلاق العناصر
 * 
 * @author HM CAR Team
 * @version 2.0.0
 */

const Car = require('../models/Car');
const SparePart = require('../models/SparePart');
const logger = require('../modules/core/logger');

class InventoryService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * الحصول على حالة المخزون لسيارة معينة
   * @param {string} carId - معرف السيارة
   * @returns {Promise<Object>} - حالة المخزون
   */
  async getCarInventoryStatus(carId) {
    try {
      // Check cache first
      const cached = this.cache.get(`car_${carId}`);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const car = await Car.findById(carId);
      if (!car) {
        throw new Error('السيارة غير موجودة');
      }

      const status = {
        id: car._id,
        title: car.title,
        isAvailable: !car.isSold && car.isActive,
        isSold: car.isSold,
        soldAt: car.soldAt,
        pendingSale: !!car.pendingSaleToken,
        stockStatus: car.isSold ? 'sold' : car.pendingSaleToken ? 'pending' : 'available'
      };

      // Cache the result
      this.cache.set(`car_${carId}`, {
        data: status,
        timestamp: Date.now()
      });

      return status;
    } catch (error) {
      logger.error('خطأ في الحصول على حالة المخزون:', error);
      throw error;
    }
  }

  /**
   * الحصول على حالة مخزون قطعة غيار
   * @param {string} partId - معرف القطعة
   * @returns {Promise<Object>} - حالة المخزون
   */
  async getPartInventoryStatus(partId) {
    try {
      const cached = this.cache.get(`part_${partId}`);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const part = await SparePart.findById(partId);
      if (!part) {
        throw new Error('قطعة الغيار غير موجودة');
      }

      const status = {
        id: part._id,
        name: part.name,
        quantity: part.quantity || 0,
        minStock: part.minStock || 5,
        isAvailable: part.quantity > 0,
        stockStatus: part.quantity === 0 ? 'out_of_stock' : 
                    part.quantity <= (part.minStock || 5) ? 'low_stock' : 'available'
      };

      this.cache.set(`part_${partId}`, {
        data: status,
        timestamp: Date.now()
      });

      return status;
    } catch (error) {
      logger.error('خطأ في الحصول على حالة مخزون القطعة:', error);
      throw error;
    }
  }

  /**
   * تحديث كمية قطعة غيار
   * @param {string} partId - معرف القطعة
   * @param {number} quantity - الكمية الجديدة
   * @param {string} reason - سبب التحديث
   * @returns {Promise<Object>} - القطعة المحدثة
   */
  async updatePartQuantity(partId, quantity, reason = '') {
    try {
      if (quantity < 0) {
        throw new Error('الكمية لا يمكن أن تكون سالبة');
      }

      const part = await SparePart.findByIdAndUpdate(
        partId,
        { 
          $set: { quantity },
          $push: {
            stockHistory: {
              quantity,
              reason,
              date: new Date()
            }
          }
        },
        { new: true }
      );

      if (!part) {
        throw new Error('قطعة الغيار غير موجودة');
      }

      // Clear cache
      this.cache.delete(`part_${partId}`);

      logger.info(`تم تحديث مخزون القطعة ${part.name} إلى ${quantity}`);
      return part;
    } catch (error) {
      logger.error('خطأ في تحديث كمية القطعة:', error);
      throw error;
    }
  }

  /**
   * تقليل كمية قطعة غيار (عند البيع)
   * @param {string} partId - معرف القطعة
   * @param {number} amount - الكمية المباعة
   * @returns {Promise<Object>} - القطعة المحدثة
   */
  async deductPartQuantity(partId, amount = 1) {
    try {
      const part = await SparePart.findById(partId);
      if (!part) {
        throw new Error('قطعة الغيار غير موجودة');
      }

      if (part.quantity < amount) {
        throw new Error('الكمية في المخزون غير كافية');
      }

      part.quantity -= amount;
      await part.save();

      // Clear cache
      this.cache.delete(`part_${partId}`);

      logger.info(`تم خصم ${amount} من مخزون القطعة ${part.name}`);
      return part;
    } catch (error) {
      logger.error('خطأ في خصم كمية القطعة:', error);
      throw error;
    }
  }

  /**
   * زيادة كمية قطعة غيار (عند الاستلام)
   * @param {string} partId - معرف القطعة
   * @param {number} amount - الكمية المستلمة
   * @returns {Promise<Object>} - القطعة المحدثة
   */
  async addPartQuantity(partId, amount) {
    try {
      if (amount <= 0) {
        throw new Error('الكمية يجب أن تكون أكبر من صفر');
      }

      const part = await SparePart.findById(partId);
      if (!part) {
        throw new Error('قطعة الغيار غير موجودة');
      }

      part.quantity += amount;
      await part.save();

      // Clear cache
      this.cache.delete(`part_${partId}`);

      logger.info(`تم إضافة ${amount} إلى مخزون القطعة ${part.name}`);
      return part;
    } catch (error) {
      logger.error('خطأ في إضافة كمية للقطعة:', error);
      throw error;
    }
  }

  /**
   * حجز سيارة (pending sale)
   * @param {string} carId - معرف السيارة
   * @param {string} buyerId - معرف المشتري
   * @returns {Promise<Object>} - نتيجة الحجز
   */
  async reserveCar(carId, buyerId) {
    try {
      const car = await Car.findById(carId);
      if (!car) {
        throw new Error('السيارة غير موجودة');
      }

      if (car.isSold) {
        throw new Error('السيارة تم بيعها بالفعل');
      }

      if (car.pendingSaleToken) {
        throw new Error('السيارة محجوزة حالياً');
      }

      // Generate reservation token
      const token = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      car.pendingSaleToken = token;
      car.pendingSaleBuyer = buyerId;
      car.pendingSaleAt = new Date();
      await car.save();

      // Clear cache
      this.cache.delete(`car_${carId}`);

      logger.info(`تم حجز السيارة ${car.title} للمشتري ${buyerId}`);
      
      return {
        success: true,
        token,
        car: {
          id: car._id,
          title: car.title
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error) {
      logger.error('خطأ في حجز السيارة:', error);
      throw error;
    }
  }

  /**
   * إلغاء حجز سيارة
   * @param {string} carId - معرف السيارة
   * @returns {Promise<Object>} - نتيجة الإلغاء
   */
  async releaseCarReservation(carId) {
    try {
      const car = await Car.findById(carId);
      if (!car) {
        throw new Error('السيارة غير موجودة');
      }

      if (!car.pendingSaleToken) {
        throw new Error('السيارة غير محجوزة');
      }

      const previousBuyer = car.pendingSaleBuyer;
      
      car.pendingSaleToken = '';
      car.pendingSaleBuyer = null;
      car.pendingSaleAt = null;
      await car.save();

      // Clear cache
      this.cache.delete(`car_${carId}`);

      logger.info(`تم إلغاء حجز السيارة ${car.title}`);
      
      return {
        success: true,
        car: {
          id: car._id,
          title: car.title
        },
        previousBuyer
      };
    } catch (error) {
      logger.error('خطأ في إلغاء حجز السيارة:', error);
      throw error;
    }
  }

  /**
   * تأكيد بيع سيارة
   * @param {string} carId - معرف السيارة
   * @param {string} buyerId - معرف المشتري
   * @returns {Promise<Object>} - نتيجة التأكيد
   */
  async confirmCarSale(carId, buyerId) {
    try {
      const car = await Car.findById(carId);
      if (!car) {
        throw new Error('السيارة غير موجودة');
      }

      if (car.isSold) {
        throw new Error('السيارة تم بيعها بالفعل');
      }

      car.isSold = true;
      car.soldTo = buyerId;
      car.soldAt = new Date();
      car.pendingSaleToken = '';
      car.pendingSaleBuyer = null;
      car.pendingSaleAt = null;
      await car.save();

      // Clear cache
      this.cache.delete(`car_${carId}`);

      logger.info(`تم تأكيد بيع السيارة ${car.title} للمشتري ${buyerId}`);
      
      return {
        success: true,
        car: {
          id: car._id,
          title: car.title,
          soldAt: car.soldAt
        }
      };
    } catch (error) {
      logger.error('خطأ في تأكيد بيع السيارة:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المخزون
   * @returns {Promise<Object>} - إحصائيات المخزون
   */
  async getInventoryStats() {
    try {
      const [carStats, partStats] = await Promise.all([
        Car.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              available: { 
                $sum: { 
                  $cond: [{ $and: [{ $eq: ['$isSold', false] }, { $eq: ['$isActive', true] }] }, 1, 0] 
                } 
              },
              sold: { $sum: { $cond: ['$isSold', 1, 0] } },
              pending: { $sum: { $cond: [{ $ne: ['$pendingSaleToken', ''] }, 1, 0] } }
            }
          }
        ]),
        SparePart.aggregate([
          {
            $group: {
              _id: null,
              totalParts: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
              lowStock: { 
                $sum: { 
                  $cond: [{ $lte: ['$quantity', { $ifNull: ['$minStock', 5] }] }, 1, 0] 
                } 
              },
              outOfStock: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } }
            }
          }
        ])
      ]);

      return {
        cars: carStats[0] || { total: 0, available: 0, sold: 0, pending: 0 },
        parts: partStats[0] || { totalParts: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0 }
      };
    } catch (error) {
      logger.error('خطأ في الحصول على إحصائيات المخزون:', error);
      throw error;
    }
  }

  /**
   * التحقق من توفر مجموعة من العناصر
   * @param {Array} items - قائمة العناصر للتحقق
   * @returns {Promise<Object>} - نتيجة التحقق
   */
  async checkAvailability(items) {
    try {
      const results = {
        available: [],
        unavailable: [],
        details: []
      };

      for (const item of items) {
        const { type, id, quantity = 1 } = item;
        
        try {
          if (type === 'car') {
            const status = await this.getCarInventoryStatus(id);
            if (status.isAvailable) {
              results.available.push(item);
            } else {
              results.unavailable.push({ ...item, reason: status.stockStatus });
            }
            results.details.push({ ...item, status });
          } else if (type === 'part') {
            const status = await this.getPartInventoryStatus(id);
            if (status.isAvailable && status.quantity >= quantity) {
              results.available.push(item);
            } else {
              results.unavailable.push({ 
                ...item, 
                reason: status.quantity < quantity ? 'insufficient_quantity' : status.stockStatus 
              });
            }
            results.details.push({ ...item, status });
          }
        } catch (error) {
          results.unavailable.push({ ...item, reason: 'not_found' });
          results.details.push({ ...item, status: null, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('خطأ في التحقق من التوفر:', error);
      throw error;
    }
  }

  /**
   * مسح ذاكرة التخزين المؤقت
   */
  clearCache() {
    this.cache.clear();
    logger.info('تم مسح ذاكرة التخزين المؤقت للمخزون');
  }
}

module.exports = new InventoryService();
