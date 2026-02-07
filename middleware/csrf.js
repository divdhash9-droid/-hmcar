// [[ARABIC_HEADER]] هذا الملف (middleware/csrf.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const crypto = require('crypto');

// Generate CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF protection middleware
function csrfProtection(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.session.csrfToken || (req.session.csrfToken = generateCSRFToken());
  res.locals.csrfToken = token;
  
  // Check for CSRF token in POST requests
  if (req.body && req.body._csrf) {
    if (req.body._csrf !== token) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  
  next();
}

// Middleware to provide CSRF token to views
function provideCSRFToken(req, res, next) {
  const token = req.session.csrfToken || (req.session.csrfToken = generateCSRFToken());
  res.locals.csrfToken = token;
  next();
}

module.exports = {
  generateCSRFToken,
  csrfProtection,
  provideCSRFToken
};
