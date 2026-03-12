// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/brands.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Brand = require('../../../models/Brand');
const AuditLog = require('../../../models/AuditLog');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');
const { cacheResponse, invalidateCache } = require('../../../middleware/cache');

// List brands
router.get('/', cacheResponse(3600), async (req, res) => {
  try {
    const { category, targetShowroom, includeInactive } = req.query;
    let query = includeInactive === 'true' ? {} : { isActive: true };
    if (category === 'cars') query = { $or: [{ forCars: true }, { forSpareParts: false }] };
    if (category === 'parts') query = { $or: [{ forSpareParts: true }, { forCars: false }] };

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
      delete query.$or;
      if (category === 'cars') {
        query.$and.push({ $or: [{ forCars: true }, { forSpareParts: false }] });
      }
      if (category === 'parts') {
        query.$and.push({ $or: [{ forSpareParts: true }, { forCars: false }] });
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
    if (category === 'parts' || category === 'both') {
      return res.status(403).json({
        success: false,
        message: 'وكالات قطع الغيار تُدار عبر الاستيراد الخارجي فقط.'
      });
    }
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
