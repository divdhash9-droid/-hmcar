// [[ARABIC_HEADER]] هذا الملف (services/NotificationService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/NotificationService.js
 * خدمة الإشعارات
 * 
 * الوصف:
 * - إرسال إشعارات للمستخدمين عند أحداث معينة
 * - دعم أنواع مختلفة: مزادات، طلبات، رسائل
 * - تخزين الإشعارات في قاعدة البيانات
 */
const UserNotification = require('../models/UserNotification');
const UserNotificationPreference = require('../models/UserNotificationPreference');
const WebSocketService = require('./WebSocketService');
const EmailService = require('./EmailService'); // Assuming you have an EmailService

class NotificationService {

    /**
     * Creates a notification in the database.
     * @param {Object} notificationData - The data for the notification.
     * @returns {Promise<Document>} The created notification document.
     */
    static async createNotification(notificationData) {
        return await UserNotification.create(notificationData);
    }

    /**
     * Sends a notification to a user based on their preferences.
     * @param {String} userId - The ID of the user.
     * @param {String} notificationType - The type of notification (e.g., 'outbid', 'newMessage').
     * @param {Object} template - The notification content template.
     */
    static async sendNotification(userId, notificationType, template) {
        const preferences = await UserNotificationPreference.findOne({ user: userId });

        // Default preferences if none are set
        const defaultPrefs = {
            [notificationType]: true,
            emailNotifications: { [notificationType]: false },
            pushNotifications: { [notificationType]: true },
        };

        const userPrefs = preferences || defaultPrefs;

        if (userPrefs[notificationType]) {
            const notification = await this.createNotification({
                user: userId,
                ...template
            });

            // Send via Push (WebSocket)
            if (userPrefs.pushNotifications && userPrefs.pushNotifications[notificationType]) {
                WebSocketService.sendToUser(userId, {
                    id: notification._id,
                    title: template.title,
                    message: template.message,
                    type: template.type,
                    data: template.metadata,
                    actionUrl: template.actionUrl
                });
            }

            // Send via Email
            if (userPrefs.emailNotifications && userPrefs.emailNotifications[notificationType]) {
                // await EmailService.sendNotificationEmail(userId, template);
                console.log(`Simulating sending email for ${notificationType} to user ${userId}`);
            }
        }
    }

    static async sendAuctionNotification(userId, auction, type, data = {}) {
        const templates = {
            'outbid': {
                title: 'لقد تمت المزايدة عليك!',
                message: `مستخدم آخر قام بوضع مزايدة أعلى في مزاد ${auction.title}.`,
                type: 'warning',
                priority: 'high',
                actionUrl: `/auctions/${auction._id}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            },
            'auction_ending': {
                title: 'المزاد على وشك الانتهاء',
                message: `مزاد ${auction.title} سينتهي خلال ساعة.`,
                type: 'auction',
                priority: 'high',
                actionUrl: `/auctions/${auction._id}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            },
            'auction_won': {
                title: 'تهانينا! لقد فزت بالمزاد',
                message: `لقد فزت بمزاد ${auction.title}.`,
                type: 'success',
                priority: 'high',
                actionUrl: `/orders/${data.orderId}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            },
            'auction_lost': {
                title: 'انتهى المزاد',
                message: `للأسف، لم تفز بمزاد ${auction.title}. حظاً أوفر في المرة القادمة!`,
                type: 'info',
                actionUrl: `/auctions/${auction._id}`,
                relatedTo: auction._id,
                relatedToModel: 'Auction',
            }
        };

        const template = templates[type];
        if (!template) return;

        await this.sendNotification(userId, type, template);
    }

    static async sendMessageNotification(userId, message) {
        const template = {
            title: 'رسالة جديدة',
            message: `لديك رسالة جديدة من ${message.sender.name}.`,
            type: 'message',
            relatedTo: message.conversation,
            relatedToModel: 'Conversation',
            actionUrl: `/messages/conversation/${message.conversation}`,
            metadata: { senderId: message.sender._id }
        };
        await this.sendNotification(userId, 'newMessage', template);
    }
    
    static async sendSystemUpdate(userId, title, message, data = {}) {
        const template = {
            title: title,
            message: message,
            type: 'system',
            priority: data.priority || 'medium',
            actionUrl: data.actionUrl,
            actionText: data.actionText,
        };
        await this.sendNotification(userId, 'systemUpdates', template);
    }

    static async sendPromotionalUpdate(userId, title, message, data = {}) {
        const template = {
            title: title,
            message: message,
            type: 'promotion',
            priority: 'low',
            actionUrl: data.actionUrl,
            actionText: data.actionText,
        };
        await this.sendNotification(userId, 'promotions', template);
    }

    /**
     * Sends a notification to multiple users.
     * @param {Array<String>} userIds - An array of user IDs.
     * @param {Object} template - The notification content template.
     * @param {String} notificationType - The type of notification.
     */
    static async sendBulkNotification(userIds, template, notificationType) {
        const preferences = await UserNotificationPreference.find({ user: { $in: userIds } });
        const prefMap = new Map(preferences.map(p => [p.user.toString(), p]));

        const notificationsToCreate = [];
        const usersToNotifyByPush = [];
        const usersToNotifyByEmail = [];

        for (const userId of userIds) {
            const userPrefs = prefMap.get(userId) || {};
            if (userPrefs[notificationType] !== false) { // Default to true
                notificationsToCreate.push({ user: userId, ...template });

                if (userPrefs.pushNotifications && userPrefs.pushNotifications[notificationType] !== false) {
                    usersToNotifyByPush.push(userId);
                }
                if (userPrefs.emailNotifications && userPrefs.emailNotifications[notificationType] === true) {
                    usersToNotifyByEmail.push(userId);
                }
            }
        }

        if (notificationsToCreate.length > 0) {
            await UserNotification.insertMany(notificationsToCreate);
        }

        // Send push notifications via WebSocket
        if (usersToNotifyByPush.length > 0) {
            WebSocketService.sendToUsers(usersToNotifyByPush, {
                title: template.title,
                message: template.message,
                type: template.type
            });
        }
        
        // Send email notifications
        // for (const userId of usersToNotifyByEmail) {
        //     await EmailService.sendNotificationEmail(userId, template);
        // }
    }
}

module.exports = NotificationService;


module.exports = NotificationService;
