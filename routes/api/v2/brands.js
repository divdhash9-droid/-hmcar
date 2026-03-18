// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/brands.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Brand = require('../../../models/Brand');
const AuditLog = require('../../../models/AuditLog');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');
const { cacheResponse, invalidateCache } = require('../../../middleware/cache');

// Reset dummy brands and parts (Admin only)
router.post('/reset-default-hmcar', requireAuthAPI, requirePermissionAPI('manage_brands'), async (req, res) => {
  try {
    const SparePart = require('../../../models/SparePart');
    await SparePart.deleteMany({});
    await Brand.deleteMany({});

    const koreanBrands = ['هيونداي / Hyundai', 'كيا / Kia', 'جينيسيس / Genesis'];
    for (const name of koreanBrands) {
       await Brand.create({
          name,
          key: name.split(' ')[0],
          logoUrl: '',
          forCars: true,
          forSpareParts: true,
          models: [],
          targetShowroom: 'both',
          isActive: true
       });
    }
    
    if (typeof invalidateCache === 'function') invalidateCache('/api/v2/brands*');
    res.json({ success: true, message: 'All dummy brands/parts wiped and Korean brands restored.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// [[ARABIC_COMMENT]] POST /api/v2/brands/fix-spare-brands - إصلاح وكالات قطع الغيار الموجودة
// يضبط forCars=false لأي وكالة تحتوي على قطع غيار مستوردة لكي لا تختلط بوكالات السيارات
router.post('/fix-spare-brands', requireAuthAPI, requirePermissionAPI('manage_brands'), async (req, res) => {
  try {
    const SparePart = require('../../../models/SparePart');
    // جلب أسماء الوكالات التي لها قطع غيار مستوردة
    const spareMakes = await SparePart.distinct('carMake');
    let fixedCount = 0;
    
    for (const make of spareMakes) {
      if (!make) continue;
      const result = await Brand.updateMany(
        { key: make.toLowerCase(), forSpareParts: true, forCars: true },
        { $set: { forCars: false } }
      );
      fixedCount += result.modifiedCount;
    }
    
    if (typeof invalidateCache === 'function') invalidateCache('/api/v2/brands*');
    res.json({ 
      success: true, 
      message: `تم إصلاح ${fixedCount} وكالة قطع غيار - لن تظهر مع وكالات السيارات بعد الآن`,
      fixedCount
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// List brands
router.get('/', cacheResponse(3600), async (req, res) => {
  try {
    const { category, targetShowroom, includeInactive } = req.query;
    let query = includeInactive === 'true' ? {} : { isActive: true };
    
    // [[ARABIC_COMMENT]] الفلتر الدقيق: وكالات السيارات تُرجع forCars=true فقط
    // وكالات قطع الغيار تُرجع forSpareParts=true فقط، ولا تختلط ببعضها
    if (category === 'cars') {
      // وكالات السيارات: يجب أن تكون forCars=true
      // نستثني الوكالات التي هي لقطع الغيار فقط (forSpareParts=true AND forCars=false)
      query = { forCars: true };
    }
    if (category === 'parts') {
      // وكالات قطع الغيار: يجب أن تكون forSpareParts=true
      query = { forSpareParts: true };
    }

    if (includeInactive !== 'true') {
      query = { ...query, isActive: true };
    }

    if (targetShowroom === 'hm_local' || targetShowroom === 'korean_import') {
      query = {
        ...query,
        $and: [
          ...(query.$and || []),
          {
            $or: [
              { targetShowroom },
              { targetShowroom: 'both' },
              { targetShowroom: { $exists: false } }
            ]
          }
        ]
      };
      if (category === 'cars') {
        if (!query.$and) query.$and = [];
        query.$and.push({ forCars: true });
      }
      if (category === 'parts') {
        if (!query.$and) query.$and = [];
        query.$and.push({ forSpareParts: true });
      }
    }

    const brands = await Brand.find(query).sort({ name: 1 }).lean();
    res.json({ success: true, brands });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create brand (Admin only)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_brands'), invalidateCache('/api/v2/brands*'), async (req, res) => {
  try {
    const { name, logoUrl, category, location, phone, whatsapp, description, description_ar, models, targetShowroom, isActive } = req.body || {};
    const payload = {
      name,
      logoUrl: logoUrl || '',
      forCars: category === 'cars' || category === 'both',
      forSpareParts: category === 'parts' || category === 'both',
      models: Array.isArray(models) ? models : [],
      location: location || '',
      phone: phone || '',
      whatsapp: whatsapp || '',
      description: description || '',
      description_ar: description_ar || '',
      targetShowroom: ['hm_local', 'korean_import', 'both'].includes(targetShowroom) ? targetShowroom : 'hm_local',
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };
    const brand = await Brand.create(payload);

    // Log brand creation
    await AuditLog.logUserAction(
      req.user.userId,
      'CREATE',
      'Brand',
      `Created new brand: ${brand.name}`,
      {
        targetId: brand._id,
        after: brand.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'api'
      }
    );

    res.json({ success: true, brand });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Update brand (Admin only)
router.put('/:id', requireAuthAPI, requirePermissionAPI('manage_brands'), invalidateCache('/api/v2/brands*'), async (req, res) => {
  try {
    const { name, logoUrl, category, location, phone, whatsapp, description, description_ar, models, targetShowroom, isActive } = req.body || {};
    if (category === 'parts' || category === 'both') {
      return res.status(403).json({
        success: false,
        message: 'تعديل وكالات قطع الغيار يدويًا غير متاح. استخدم الاستيراد الخارجي.'
      });
    }
    const oldBrand = await Brand.findById(req.params.id);
    const payload = {
      ...(name !== undefined ? { name } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(whatsapp !== undefined ? { whatsapp } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(description_ar !== undefined ? { description_ar } : {}),
      ...(models !== undefined ? { models: Array.isArray(models) ? models : [] } : {}),
      ...(targetShowroom !== undefined && ['hm_local', 'korean_import', 'both'].includes(targetShowroom)
        ? { targetShowroom }
        : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(category
        ? { forCars: category === 'cars' || category === 'both', forSpareParts: category === 'parts' || category === 'both' }
        : {}),
    };
    const brand = await Brand.findByIdAndUpdate(req.params.id, payload, { new: true });

    if (brand) {
      // Log brand update
      await AuditLog.logUserAction(
        req.user.userId,
        'UPDATE',
        'Brand',
        `Updated brand: ${brand.name}`,
        {
          targetId: brand._id,
          before: oldBrand ? oldBrand.toObject() : null,
          after: brand.toObject(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID || 'api'
        }
      );
    }

    res.json({ success: true, brand });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Delete brand (Admin only)
router.delete('/:id', requireAuthAPI, requirePermissionAPI('manage_brands'), invalidateCache('/api/v2/brands*'), async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (brand) {
      // Log brand deletion
      await AuditLog.logUserAction(
        req.user.userId,
        'DELETE',
        'Brand',
        `Deleted brand: ${brand.name}`,
        {
          targetId: req.params.id,
          before: brand.toObject(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID || 'api'
        }
      );
    }

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
