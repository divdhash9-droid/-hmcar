// [[ARABIC_HEADER]] API لإدارة إعدادات الموقع

const express = require('express');
const router = express.Router();
const SiteSettings = require('../../../models/SiteSettings');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// الحصول على إعدادات الموقع (عام - للزوار)
router.get('/public', async (req, res) => {
    try {
        const settings = await SiteSettings.getSettings();

        res.json({
            success: true,
            data: {
                socialLinks: settings.socialLinks,
                contactInfo: settings.contactInfo,
                siteInfo: settings.siteInfo,
                currencySettings: settings.currencySettings,
                features: settings.features,
                homeContent: settings.homeContent
            }
        });
    } catch (error) {
        console.error('Error fetching public settings:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في جلب إعدادات الموقع'
        });
    }
});

// الحصول على كل الإعدادات (للأدمن فقط)
router.get('/', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const settings = await SiteSettings.getSettings();

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في جلب الإعدادات'
        });
    }
});

// تحديث روابط التواصل الاجتماعي
router.put('/social-links', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { socialLinks } = req.body;

        const settings = await SiteSettings.updateSettings(
            { socialLinks },
            req.user._id
        );

        res.json({
            success: true,
            message: 'تم تحديث روابط التواصل الاجتماعي',
            data: settings.socialLinks
        });
    } catch (error) {
        console.error('Error updating social links:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في تحديث الروابط'
        });
    }
});

// تحديث معلومات الاتصال
router.put('/contact-info', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { contactInfo } = req.body;

        const settings = await SiteSettings.updateSettings(
            { contactInfo },
            req.user._id
        );

        res.json({
            success: true,
            message: 'تم تحديث معلومات الاتصال',
            data: settings.contactInfo
        });
    } catch (error) {
        console.error('Error updating contact info:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في تحديث معلومات الاتصال'
        });
    }
});

// تحديث معلومات الموقع
router.put('/site-info', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { siteInfo } = req.body;

        const settings = await SiteSettings.updateSettings(
            { siteInfo },
            req.user._id
        );

        res.json({
            success: true,
            message: 'تم تحديث معلومات الموقع',
            data: settings.siteInfo
        });
    } catch (error) {
        console.error('Error updating site info:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في تحديث معلومات الموقع'
        });
    }
});

// تحديث إعدادات العملة
router.put('/currency-settings', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { currencySettings } = req.body;

        const settings = await SiteSettings.updateSettings(
            { currencySettings },
            req.user._id
        );

        res.json({
            success: true,
            message: 'تم تحديث إعدادات العملة',
            data: settings.currencySettings
        });
    } catch (error) {
        console.error('Error updating currency settings:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في تحديث إعدادات العملة'
        });
    }
});

// تحديث ميزات "لماذا تختارنا"
router.put('/features', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { features } = req.body;

        const settings = await SiteSettings.updateSettings(
            { features },
            req.user._id
        );

        res.json({
            success: true,
            message: 'تم تحديث ميزات لماذا تختارنا بنجاح',
            data: settings.features
        });
    } catch (error) {
        console.error('Error updating features:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في تحديث الميزات'
        });
    }
});

// تحديث محتوى الصفحة الرئيسية
router.put('/home-content', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const { homeContent } = req.body;

        const settings = await SiteSettings.updateSettings(
            { homeContent },
            req.user._id
        );

        res.json({
            success: true,
            message: 'تم تحديث محتوى الصفحة الرئيسية بنجاح',
            data: settings.homeContent
        });
    } catch (error) {
        console.error('Error updating home content:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'فشل في تحديث المحتوى'
        });
    }
});

module.exports = router;
