const express = require('express');
const router = express.Router();
const Brand = require('../../../models/Brand');

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

// Create brand
router.post('/', async (req, res) => {
  try {
    const { name, logoUrl, category } = req.body || {};
    const payload = {
      name,
      logoUrl: logoUrl || '',
      forCars: category === 'cars' || category === 'both',
      forSpareParts: category === 'parts' || category === 'both',
    };
    const brand = await Brand.create(payload);
    res.json({ success: true, brand });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Update brand
router.put('/:id', async (req, res) => {
  try {
    const { name, logoUrl, category } = req.body || {};
    const payload = {
      ...(name !== undefined ? { name } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(category
        ? { forCars: category === 'cars' || category === 'both', forSpareParts: category === 'parts' || category === 'both' }
        : {}),
    };
    const brand = await Brand.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json({ success: true, brand });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
