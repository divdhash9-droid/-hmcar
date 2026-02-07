'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Car = require('../../models/Car');

const router = express.Router();

function ensureDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// GET /api/cars
// Lightweight JSON listing endpoint for clients.
router.get('/', async (req, res) => {
  try {
    if (!ensureDbConnected()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database is not connected',
      });
    }

    const limitRaw = Number.parseInt(String(req.query.limit ?? ''), 10);
    const pageRaw = Number.parseInt(String(req.query.page ?? ''), 10);

    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.brand) filters.brand = req.query.brand;
    if (req.query.status) filters.status = req.query.status;

    const [items, total] = await Promise.all([
      Car.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Car.countDocuments(filters),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/cars failed:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    if (!ensureDbConnected()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database is not connected',
      });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid car id',
      });
    }

    const car = await Car.findById(id).lean();
    if (!car) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Car not found',
      });
    }

    res.json(car);
  } catch (error) {
    console.error('GET /api/cars/:id failed:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
