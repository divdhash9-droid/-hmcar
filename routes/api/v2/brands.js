// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/brands.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Brand = require('../../../models/Brand');
const AuditLog = require('../../../models/AuditLog');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');

// List brands
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category === 'cars') query = { $or: [{ forCars: true }, { forSpareParts: false }] };
    if (category === 'parts') query = { $or: [{ forSpareParts: true }, { forCars: false }] };
    const brands = await Brand.find(query).sort({ name: 1 }).lean();
    res.json({ success: true, brands });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create brand (Admin only)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_brands'), async (req, res) => {
  try {
    const { name, logoUrl, category, location, phone, whatsapp, description, description_ar } = req.body || {};
    const payload = {
      name,
      logoUrl: logoUrl || '',
      forCars: category === 'cars' || category === 'both',
      forSpareParts: category === 'parts' || category === 'both',
      location: location || '',
      phone: phone || '',
      whatsapp: whatsapp || '',
      description: description || '',
      description_ar: description_ar || '',
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
router.put('/:id', requireAuthAPI, requirePermissionAPI('manage_brands'), async (req, res) => {
  try {
    const { name, logoUrl, category, location, phone, whatsapp, description, description_ar } = req.body || {};
    const oldBrand = await Brand.findById(req.params.id);
    const payload = {
      ...(name !== undefined ? { name } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(whatsapp !== undefined ? { whatsapp } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(description_ar !== undefined ? { description_ar } : {}),
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
router.delete('/:id', requireAuthAPI, requirePermissionAPI('manage_brands'), async (req, res) => {
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
