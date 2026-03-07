// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/parts.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const SparePart = require('../../../models/SparePart');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/parts - قائمة قطع الغيار
router.get('/', async (req, res) => {
    try {
        const { category, q, brand, carModel, limit = 20 } = req.query;
        const filter = {};

        if (category && category !== 'ALL') {
            filter.partType = new RegExp(category, 'i');
        }

        // [[ARABIC_COMMENT]] دعم البحث بالاسم أو الوكالة أو صانع السيارة
        if (q) {
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ name: re }, { partType: re }, { carMake: re }];
        }

        // [[ARABIC_COMMENT]] فلتر مباشر حسب وكالة السيارة (brand=toyota مثلاً)
        if (brand) {
            filter.carMake = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }

        // [[ARABIC_COMMENT]] فلتر مباشر حسب الموديل
        if (carModel && carModel !== 'ALL') {
            filter.carModel = new RegExp(carModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }

        const parts = await SparePart.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();

        res.json({
            success: true,
            parts: parts.map(p => ({
                id: p._id,
                name: p.name,
                brand: p.carMake || p.brand,
                price: p.priceSar || p.price || 0,
                currency: 'SAR',
                category: p.partType,
                condition: p.condition || 'NEW',
                img: p.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop',
                images: p.images || [],
                carModel: p.carModel || '',
                compatibility: [p.carModel || 'ALL Models'],
                stock: p.stockQty || 1,
                rareLevel: 3
            }))
        });
    } catch (error) {
        console.error('API Parts error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/parts - Add new part
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const partData = req.body;
        // Basic validation/sanitization could happen here

        // Map frontend fields (like brand -> carMake) if needed
        const newPart = new SparePart({
            name: partData.name,
            partType: partData.category || partData.partType,
            carMake: partData.brand || partData.carMake,
            carModel: partData.model,
            carYear: partData.year,
            price: partData.price,
            priceSar: partData.price,
            condition: partData.condition,
            images: partData.images || [],
            description: partData.description,
            stockQty: partData.stockQty !== undefined ? partData.stockQty : 1,
            inStock: (partData.stockQty !== undefined ? partData.stockQty : 1) > 0
        });

        await newPart.save();

        res.status(201).json({
            success: true,
            data: newPart,
            message: 'Part created successfully'
        });
    } catch (error) {
        console.error('Create part error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/v2/parts/:id - Update part
router.put('/:id', requireAuthAPI, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Use mapped data for update
        const mappedUpdate = {
            name: updateData.name,
            partType: updateData.category || updateData.partType,
            carMake: updateData.brand || updateData.carMake,
            carModel: updateData.model,
            carYear: updateData.year,
            price: updateData.price,
            priceSar: updateData.price,
            condition: updateData.condition,
            images: updateData.images || [], // Ensure images are updated
            description: updateData.description,
            stockQty: updateData.stockQty,
            inStock: updateData.stockQty > 0
        };

        const part = await SparePart.findByIdAndUpdate(id, mappedUpdate, { new: true });

        if (!part) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        res.json({
            success: true,
            data: part,
            message: 'Part updated successfully'
        });
    } catch (error) {
        console.error('Update part error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/v2/parts/:id - Delete part
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        const { id } = req.params;
        const part = await SparePart.findByIdAndDelete(id);

        if (!part) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        res.json({
            success: true,
            message: 'Part deleted successfully'
        });
    } catch (error) {
        console.error('Delete part error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// [[ARABIC_COMMENT]] PATCH /api/v2/parts/:id/sold - تسجيل بيع قطعة غيار
// [[ARABIC_COMMENT]] المنطق: إذا stockQty > 1 → ينقص واحد، إذا = 1 → يُخفي القطعة (inStock=false)
router.patch('/:id/sold', requireAuthAPI, async (req, res) => {
    try {
        const { soldQty = 1 } = req.body;

        const part = await SparePart.findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        const currentStock = part.stockQty || 1;
        const newStock = Math.max(0, currentStock - soldQty);

        const updates = {
            stockQty: newStock,
            inStock: newStock > 0,
            // [[ARABIC_COMMENT]] إذا نفد المخزون تماماً، نُسجّل وقت البيع
            ...(newStock === 0 ? { soldAt: new Date() } : {})
        };

        const updatedPart = await SparePart.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );

        // [[ARABIC_COMMENT]] تسجيل في AuditLog للتقارير التلقائية
        try {
            const AuditLog = require('../../../models/AuditLog');
            await AuditLog.create({
                action: 'SOLD',
                targetModel: 'SparePart',
                description: `تم بيع ${soldQty} قطعة من: ${part.name} — المتبقي: ${newStock}`,
                targetId: part._id,
                after: { soldQty, newStock, soldAt: new Date() },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api'
            });
        } catch (logErr) {
            console.error('AuditLog error:', logErr);
        }

        res.json({
            success: true,
            data: updatedPart,
            soldQty,
            newStock,
            message: newStock === 0
                ? `تم بيع القطعة وتم إخفاؤها (نفد المخزون)`
                : `تم بيع ${soldQty} قطعة. المتبقي في المخزون: ${newStock}`
        });
    } catch (error) {
        console.error('Mark part as sold error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
