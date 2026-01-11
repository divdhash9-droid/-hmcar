const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security middleware
router.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
router.use(limiter);

// API version info
router.get('/', (req, res) => {
  res.json({
    name: 'HM CAR Auction API',
    version: '2.0.0',
    description: 'Advanced RESTful API for car auction management system',
    endpoints: {
      notifications: '/notifications',
      analytics: '/analytics'
    },
    documentation: '/docs',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name
      },
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
router.use('/notifications', require('./notifications'));
router.use('/analytics', require('./analytics'));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.errors
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this value already exists'
    });
  }
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /notifications',
        'GET /analytics'
    ]
  });
});

module.exports = router;
