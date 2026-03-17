// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/invoices.js) جزء من مشروع HM CAR ويتحكم في إنشاء الفواتير المخصصة.

const express = require('express');
const router = express.Router();
const Invoice = require('../../../models/Invoice');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/invoices - جلب الفواتير (للأدمن فقط)
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [invoices, total] = await Promise.all([
            Invoice.find()
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Invoice.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET /api/v2/invoices/next-number - جلب رقم الفاتورة التالي
router.get('/next-number', requireAuthAPI, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({ createdAt: { $gte: new Date(year, 0, 1) } });
    const nextNumber = `HM-INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
    res.json({ success: true, data: nextNumber });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error' });
  }
});

// POST /api/v2/invoices - إنشاء فاتورة جديدة
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }

        const { 
          buyerName, 
          buyerPhone, 
          buyerAddress, 
          items, 
          currencySnapshot, 
          notes, 
          destination, 
          invoiceDate,
          totalKrw,
          totalUsd,
          totalSar
        } = req.body;

        // توليد رقم فاتورة فريد إذا لم يُمرر
        const year = new Date().getFullYear();
        const count = await Invoice.countDocuments({ createdAt: { $gte: new Date(year, 0, 1) } });
        const invoiceNumber = req.body.invoiceNumber || `HM-INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

        const newInvoice = new Invoice({
            invoiceNumber,
            buyerName,
            buyerPhone,
            buyerAddress,
            items,
            currencySnapshot,
            notes,
            destination,
            invoiceDate: invoiceDate || new Date(),
            totalKrw,
            totalUsd,
            totalSar,
            createdBy: req.user.userId || req.user._id,
            status: 'draft'
        });

        await newInvoice.save();

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: newInvoice
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
    }
});

// GET /api/v2/invoices/:id - جلب تفاصيل فاتورة محددة
router.get('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }

        const invoice = await Invoice.findById(req.params.id).lean();

        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PATCH /api/v2/invoices/:id/status - تحديث حالة الفاتورة
router.patch('/:id/status', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }

        const { status } = req.body;
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        res.json({ success: true, message: 'Invoice status updated successfully', data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// DELETE /api/v2/invoices/:id - حذف فاتورة
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }

        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
