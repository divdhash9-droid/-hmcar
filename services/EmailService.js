// [[ARABIC_HEADER]] هذا الملف (services/EmailService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/EmailService.js
 * خدمة البريد الإلكتروني
 *
 * الوصف:
 * - إرسال رسائل بريد إلكتروني للمستخدمين
 * - دعم قوالب البريد الإلكتروني
 * - إشعارات عبر البريد الإلكتروني
 */

const nodemailer = require('nodemailer');

class EmailService {
    static getTransporter() {
        try {
            return nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } catch (e) {
            console.warn('⚠️ Email transporter not configured:', e.message);
            return null;
        }
    }

    /**
     * إرسال بريد إلكتروني
     * @param {Object} options - خيارات البريد
     * @param {string} options.to - البريد المستلم
     * @param {string} options.subject - عنوان الرسالة
     * @param {string} options.html - محتوى HTML
     * @param {string} options.text - محتوى نصي
     */
    static async sendEmail({ to, subject, html, text }) {
        const transporter = this.getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Skipped sending email to ${to} (not configured)`);
            return { success: false, reason: 'not_configured' };
        }

        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || `HM CAR <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                text
            });
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * إرسال إشعار بريد إلكتروني لمستخدم
     * @param {string} userId - معرف المستخدم
     * @param {Object} template - قالب الإشعار
     */
    static async sendNotificationEmail(userId, template) {
        try {
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (!user || !user.email) return;

            await this.sendEmail({
                to: user.email,
                subject: template.title || 'إشعار من HM CAR',
                html: `
                    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
                        <h2 style="color: #c9a96e;">${template.title}</h2>
                        <p>${template.message}</p>
                        ${template.actionUrl ? `<a href="${process.env.BASE_URL || 'https://car-auction-sand.vercel.app'}${template.actionUrl}" style="background: #c9a96e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">عرض التفاصيل</a>` : ''}
                        <hr style="border: 1px solid #eee; margin-top: 20px;" />
                        <p style="color: #999; font-size: 12px;">HM CAR - منصة مزادات السيارات الفاخرة</p>
                    </div>
                `,
                text: `${template.title}\n${template.message}`
            });
        } catch (error) {
            console.warn('⚠️ Failed to send notification email:', error.message);
        }
    }
}

module.exports = EmailService;
