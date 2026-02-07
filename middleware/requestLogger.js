// [[ARABIC_HEADER]] هذا الملف (middleware/requestLogger.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Request Logging Middleware
 * تسجيل تفصيلي لجميع الطلبات
 */

const logger = require('../services/LoggerService');

/**
 * HTTP Request Logger Middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.session?.user?._id,
    query: req.query,
    body: sanitizeBody(req.body)
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.http('Outgoing response', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.session?.user?._id
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration}ms`
      });
    }

    // Performance metrics
    logger.performance('request_duration', duration, {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode
    });

    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Error Logging Middleware
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', err, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userId: req.session?.user?._id,
    body: sanitizeBody(req.body),
    query: req.query
  });

  next(err);
}

/**
 * Sanitize sensitive data from body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sensitive = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
  const sanitized = { ...body };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

module.exports = {
  requestLogger,
  errorLogger
};
