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

// [[ARABIC_COMMENT]] PATCH /api/v2/parts/:id/toggle-stock - تبديل حالة الظهور (In Stock / Out of Stock)
router.patch('/:id/toggle-stock', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const part = await SparePart.findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        part.inStock = !part.inStock;
        if (part.inStock && (part.stockQty || 0) <= 0) {
            part.stockQty = 1; // إذا كان مخفياً بسبب نفاذ الكمية وأعدنا إظهاره، نضع كمية افتراضية
        }

        await part.save();

        res.json({
            success: true,
            data: part,
            message: part.inStock ? 'تم إظهار القطعة بنجاح' : 'تم إخفاء القطعة بنجاح'
        });
    } catch (error) {
        console.error('Toggle part stock error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
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

const axios = require('axios');
const cheerio = require('cheerio');
const Brand = require('../../../models/Brand');

// [[ARABIC_COMMENT]] POST /api/v2/parts/scrape - جلب وكالات وقطع غيار من autospare.com.eg (أدمن فقط)
router.post('/scrape', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const BASE_URL = 'https://autospare.com.eg';
        const BRANDS_URL = `${BASE_URL}/brands`;

        // [[ARABIC_COMMENT]] 1. جلب الوكالات (Brands) من الصفحة الرئيسية للعلامات التجارية
        const { data: brandsHtml } = await axios.get(BRANDS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const $brands = cheerio.load(brandsHtml);
        const results = { brandsCreated: 0, modelsUpdated: 0, partsCreated: 0 };

        const brandsToProcess = [];
        $brands('a.brand-card-link').each((i, el) => {
            const name = $brands(el).find('h3').text().trim();
            const href = $brands(el).attr('href');
            const logo = $brands(el).find('img').attr('src');

            if (name && href) {
                brandsToProcess.push({
                    name,
                    url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                    logo: logo ? (logo.startsWith('http') ? logo : `${BASE_URL}${logo}`) : ''
                });
            }
        });

        // [[ARABIC_COMMENT]] تقليل العدد لتجنب مشاكل الأداء والوقت في الطلب الواحد
        const limitBrands = brandsToProcess.slice(0, 15);

        for (const bData of limitBrands) {
            let brand = await Brand.findOne({ key: bData.name.toLowerCase() });
            if (!brand) {
                brand = await Brand.create({
                    name: bData.name,
                    key: bData.name.toLowerCase(),
                    logoUrl: bData.logo,
                    forSpareParts: true,
                    forCars: true,
                    models: []
                });
                results.brandsCreated++;
            } else {
                if (!brand.forSpareParts) {
                    brand.forSpareParts = true;
                    await brand.save();
                }
                if (bData.logo && !brand.logoUrl) {
                    brand.logoUrl = bData.logo;
                    await brand.save();
                }
            }

            // [[ARABIC_COMMENT]] 2. جلب الموديلات لكل وكالة
            try {
                const { data: modelsHtml } = await axios.get(bData.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $models = cheerio.load(modelsHtml);
                const modelsFound = [];
                const modelUrls = [];

                $models('a.brand-card-link').each((i, el) => {
                    const mName = $models(el).find('h3').text().trim();
                    const mHref = $models(el).attr('href');
                    if (mName && mHref) {
                        modelsFound.push(mName);
                        modelUrls.push(mHref.startsWith('http') ? mHref : `${BASE_URL}${mHref}`);
                    }
                });

                // تحديث الموديلات في قاعدة البيانات إذا كانت جديدة
                if (modelsFound.length > 0) {
                    const uniqueModels = [...new Set([...(brand.models || []), ...modelsFound])];
                    if (uniqueModels.length !== (brand.models || []).length) {
                        brand.models = uniqueModels;
                        await brand.save();
                        results.modelsUpdated++;
                    }
                }

                // [[ARABIC_COMMENT]] 3. جلب قطع الغيار لبعض الموديلات (حد أقصى 2 موديل لكل ماركة لتجنب البطء)
                for (let i = 0; i < Math.min(modelUrls.length, 2); i++) {
                    const mUrl = modelUrls[i];
                    const modelName = modelsFound[i];

                    const { data: partsHtml } = await axios.get(mUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const $parts = cheerio.load(partsHtml);

                    $parts('div.card').each(async (j, el) => {
                        const pName = $parts(el).find('a.text-decoration-none h3').text().trim();
                        const pImg = $parts(el).find('a.card-image-content img').attr('src');
                        // محاولة استخراج السعر
                        const pPriceText = $parts(el).text().match(/(\d+)\s*جنيه/);
                        const pPrice = pPriceText ? parseInt(pPriceText[1]) : 0;

                        if (pName) {
                            // التحقق مما إذا كانت القطعة موجودة مسبقاً
                            const existing = await SparePart.findOne({ name: pName, brand: brand._id });
                            if (!existing) {
                                await SparePart.create({
                                    name: pName,
                                    partType: 'General', // يمكن تحسين هذا بجلب التصنيف من الموقع
                                    brand: brand._id,
                                    carMake: brand.name,
                                    carModel: modelName,
                                    price: pPrice,
                                    priceSar: Math.ceil(pPrice * 0.12), // تحويل تقريبي من جنيه لمصري لريال
                                    stockQty: 5,
                                    inStock: true,
                                    images: pImg ? [pImg.startsWith('http') ? pImg : `${BASE_URL}${pImg}`] : []
                                });
                                results.partsCreated++;
                            }
                        }
                    });
                }
            } catch (err) {
                console.error(`Error scraping brand ${bData.name}:`, err.message);
            }
        }

        res.json({
            success: true,
            message: 'Scraping/Import completed successfully from autospare.com.eg',
            stats: results
        });
    } catch (error) {
        console.error('Overall Scrape error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
