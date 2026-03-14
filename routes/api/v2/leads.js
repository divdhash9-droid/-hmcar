// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/leads.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Lead = require('../../../models/Lead');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');

// POST /api/v2/leads - استقبال Lead جديد (عام)
router.post('/', async (req, res) => {
    try {
        const { name, phone, company, model, category, query, source } = req.body || {};

        if (!name && !phone) {
            return res.status(400).json({
                success: false,
                error: 'الاسم أو رقم الهاتف مطلوب'
            });
        }

        const lead = await Lead.create({
            name: name ? String(name).trim() : '',
            phone: phone ? String(phone).trim() : '',
            company: company ? String(company).trim() : '',
            model: model ? String(model).trim() : '',
            category: category ? String(category).trim() : '',
            query: query ? String(query).trim() : '',
            source: source ? String(source).trim() : 'web',
            status: 'new'
        });

        // سجل نشاط للأدمن
        try {
            const AuditLog = require('../../../models/AuditLog');
            await AuditLog.create({
                action: 'CREATE',
                target: 'Lead',
                targetId: lead._id,
                description: `Lead جديد: ${lead.name || lead.phone || 'غير معروف'}`,
                metadata: { category: lead.category, query: lead.query, source: lead.source }
            });
        } catch (auditErr) {
            console.error('Failed to log lead activity', auditErr);
        }

        res.status(201).json({ success: true, data: { id: lead._id } });
    } catch (error) {
        console.error('Lead create error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET /api/v2/leads - قائمة الـ Leads (admin only)
router.get('/', requireAuthAPI, requireAdmin, async (req, res) => {
    try {
        const status = String(req.query.status || 'all');
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = status !== 'all' ? { status } : {};

        const [leads, total] = await Promise.all([
            Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Lead.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: leads,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Leads list error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
