// [[ARABIC_HEADER]] هذا الملف (services/SmartAlertService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/SmartAlertService.js
 * خدمة التنبيهات الذكية
 *
 * الوظيفة الرئيسية:
 * - عند إضافة سيارة جديدة، يتم البحث عن كل التنبيهات الذكية النشطة
 * - مقارنة خصائص السيارة مع معايير كل تنبيه
 * - إرسال إشعار فوري لأصحاب التنبيهات المطابقة
 * - تجنب إرسال إشعارات مكررة لنفس السيارة
 */

const SmartAlert = require('../models/SmartAlert');
const UserNotification = require('../models/UserNotification');
const NotificationService = require('./NotificationService');

class SmartAlertService {

    /**
     * يُستدعى هذا الدالة عند إضافة سيارة جديدة أو تحديثها
     * تتحقق من جميع التنبيهات الذكية النشطة وترسل إشعارات للمطابقة
     *
     * @param {Object} car - وثيقة السيارة من MongoDB
     */
    static async checkNewCar(car) {
        try {
            // جلب جميع التنبيهات النشطة التي لم تُرسل لها إشعارات عن هذه السيارة
            const alerts = await SmartAlert.find({
                isActive: true,
                notifiedCarIds: { $nin: [car._id] }
            }).lean();

            if (!alerts || alerts.length === 0) return;

            const matchingAlerts = [];

            for (const alert of alerts) {
                if (this._doesCarMatchCriteria(car, alert.criteria)) {
                    matchingAlerts.push(alert);
                }
            }

            if (matchingAlerts.length === 0) return;

            console.log(`[SmartAlert] سيارة جديدة "${car.title}" تطابق ${matchingAlerts.length} تنبيه ذكي`);

            // إرسال الإشعارات بشكل متوازٍ
            await Promise.allSettled(
                matchingAlerts.map(alert => this._triggerAlert(alert, car))
            );

        } catch (err) {
            console.error('[SmartAlert] خطأ في checkNewCar:', err.message);
        }
    }

    /**
     * التحقق من مطابقة السيارة لمعايير التنبيه
     * @param {Object} car - بيانات السيارة
     * @param {Object} criteria - معايير التنبيه
     * @returns {boolean}
     */
    static _doesCarMatchCriteria(car, criteria) {
        // التحقق من الماركة
        if (criteria.make && criteria.make.trim() !== '') {
            if (!car.make) return false;
            const carMake = car.make.toLowerCase().trim();
            const critMake = criteria.make.toLowerCase().trim();
            if (!carMake.includes(critMake) && !critMake.includes(carMake)) return false;
        }

        // التحقق من الموديل
        if (criteria.model && criteria.model.trim() !== '') {
            if (!car.model) return false;
            const carModel = car.model.toLowerCase().trim();
            const critModel = criteria.model.toLowerCase().trim();
            if (!carModel.includes(critModel) && !critModel.includes(carModel)) return false;
        }

        // نطاق السنة
        if (criteria.yearMin && car.year < criteria.yearMin) return false;
        if (criteria.yearMax && car.year > criteria.yearMax) return false;

        // نطاق السعر (بالريال السعودي)
        const carPrice = car.priceSar || car.price || 0;
        if (criteria.priceMin && carPrice < criteria.priceMin) return false;
        if (criteria.priceMax && criteria.priceMax > 0 && carPrice > criteria.priceMax) return false;

        // نوع الوقود
        if (criteria.fuelType && criteria.fuelType !== '') {
            if (car.fuelType !== criteria.fuelType) return false;
        }

        // ناقل الحركة
        if (criteria.transmission && criteria.transmission !== '') {
            if (car.transmission !== criteria.transmission) return false;
        }

        // الفئة
        if (criteria.category && criteria.category !== '') {
            if (car.category !== criteria.category) return false;
        }

        // الحالة
        if (criteria.condition && criteria.condition !== '') {
            if (car.condition !== criteria.condition) return false;
        }

        // نوع الإدراج
        if (criteria.listingType && criteria.listingType !== '') {
            if (car.listingType !== criteria.listingType) return false;
        }

        return true;
    }

    /**
     * تفعيل تنبيه واحد وإرسال الإشعار للمستخدم
     * @param {Object} alert - وثيقة التنبيه
     * @param {Object} car - وثيقة السيارة
     */
    static async _triggerAlert(alert, car) {
        try {
            // بناء نص الإشعار
            const carTitle = car.title || `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim();
            const price = car.priceSar
                ? `${car.priceSar.toLocaleString('ar-SA')} ر.س`
                : car.price
                    ? `${car.price.toLocaleString()} USD`
                    : '';

            const template = {
                title: `🎯 تنبيه: سيارة جديدة تطابق "${alert.name}"`,
                message: `وصلت سيارة جديدة تطابق تنبيهك الذكي:\n${carTitle}${price ? ` - ${price}` : ''}`,
                type: 'smart_alert',
                priority: 'high',
                actionUrl: `/cars/${car._id}`,
                actionText: 'عرض السيارة',
                relatedTo: car._id,
                relatedToModel: 'Car',
                metadata: {
                    alertId: alert._id,
                    alertName: alert.name,
                    carId: car._id,
                    carTitle,
                    price
                }
            };

            // إنشاء الإشعار في قاعدة البيانات
            await UserNotification.create({
                user: alert.user,
                ...template
            });

            // إرسال عبر WebSocket (إشعار فوري)
            if (alert.channels && alert.channels.inApp) {
                try {
                    const WebSocketService = require('./WebSocketService');
                    WebSocketService.sendToUser(alert.user.toString(), {
                        title: template.title,
                        message: template.message,
                        type: template.type,
                        actionUrl: template.actionUrl,
                        data: template.metadata
                    });
                } catch (wsErr) {
                    // WebSocket قد لا يكون متصلاً، نتجاهل الخطأ
                }
            }

            // تحديث سجل التنبيه
            await SmartAlert.findByIdAndUpdate(alert._id, {
                $inc: { triggerCount: 1 },
                $set: {
                    lastTriggeredAt: new Date(),
                    lastTriggeredCarId: car._id
                },
                $addToSet: { notifiedCarIds: car._id }
            });

            console.log(`[SmartAlert] ✅ أُرسل إشعار للمستخدم ${alert.user} عن تنبيه "${alert.name}"`);

        } catch (err) {
            console.error(`[SmartAlert] ❌ خطأ في تفعيل تنبيه ${alert._id}:`, err.message);
        }
    }

    /**
     * إنشاء تنبيه ذكي جديد للمستخدم
     * @param {String} userId - معرف المستخدم
     * @param {Object} data - بيانات التنبيه
     * @returns {Object} التنبيه المُنشأ
     */
    static async createAlert(userId, data) {
        // التحقق من الحد الأقصى (10 تنبيهات)
        const count = await SmartAlert.countForUser(userId);
        if (count >= 10) {
            throw new Error('لا يمكن إضافة أكثر من 10 تنبيهات ذكية');
        }

        const alert = await SmartAlert.create({
            user: userId,
            name: data.name,
            criteria: {
                make: data.make || '',
                model: data.model || '',
                yearMin: data.yearMin || null,
                yearMax: data.yearMax || null,
                priceMin: data.priceMin || null,
                priceMax: data.priceMax || null,
                fuelType: data.fuelType || '',
                transmission: data.transmission || '',
                category: data.category || '',
                condition: data.condition || '',
                listingType: data.listingType || ''
            },
            channels: {
                inApp: data.inApp !== false,
                email: data.email === true
            },
            frequency: data.frequency || 'immediate'
        });

        return alert;
    }

    /**
     * تحديث تنبيه موجود
     * @param {String} alertId - معرف التنبيه
     * @param {String} userId - معرف المستخدم (للتحقق من الملكية)
     * @param {Object} data - البيانات المحدّثة
     * @returns {Object} التنبيه المحدّث
     */
    static async updateAlert(alertId, userId, data) {
        const alert = await SmartAlert.findOne({ _id: alertId, user: userId });
        if (!alert) throw new Error('التنبيه غير موجود أو ليس لديك صلاحية');

        if (data.name !== undefined) alert.name = data.name;
        if (data.isActive !== undefined) alert.isActive = data.isActive;
        if (data.frequency !== undefined) alert.frequency = data.frequency;

        if (data.channels) {
            alert.channels.inApp = data.channels.inApp !== false;
            alert.channels.email = data.channels.email === true;
        }

        if (data.criteria) {
            alert.criteria = {
                make: data.criteria.make || '',
                model: data.criteria.model || '',
                yearMin: data.criteria.yearMin || null,
                yearMax: data.criteria.yearMax || null,
                priceMin: data.criteria.priceMin || null,
                priceMax: data.criteria.priceMax || null,
                fuelType: data.criteria.fuelType || '',
                transmission: data.criteria.transmission || '',
                category: data.criteria.category || '',
                condition: data.criteria.condition || '',
                listingType: data.criteria.listingType || ''
            };
        }

        await alert.save();
        return alert;
    }

    /**
     * حذف تنبيه
     * @param {String} alertId
     * @param {String} userId
     */
    static async deleteAlert(alertId, userId) {
        const result = await SmartAlert.findOneAndDelete({ _id: alertId, user: userId });
        if (!result) throw new Error('التنبيه غير موجود أو ليس لديك صلاحية');
        return result;
    }

    /**
     * جلب جميع تنبيهات المستخدم
     * @param {String} userId
     * @returns {Array}
     */
    static async getUserAlerts(userId) {
        return await SmartAlert.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * إحصائيات التنبيهات للمستخدم
     * @param {String} userId
     */
    static async getUserStats(userId) {
        const alerts = await SmartAlert.find({ user: userId }).lean();
        return {
            total: alerts.length,
            active: alerts.filter(a => a.isActive).length,
            totalTriggers: alerts.reduce((sum, a) => sum + (a.triggerCount || 0), 0)
        };
    }
}

module.exports = SmartAlertService;
