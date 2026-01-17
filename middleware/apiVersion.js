// [[ARABIC_HEADER]] هذا الملف (middleware/apiVersion.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * API Versioning Middleware
 * إدارة إصدارات الـ API
 */

/**
 * Extract API version from request
 */
function extractApiVersion(req) {
  // Check URL path (/api/v1, /api/v2, etc.)
  const pathMatch = req.path.match(/^\/api\/v(\d+)/);
  if (pathMatch) {
    return parseInt(pathMatch[1]);
  }

  // Check Accept header (application/vnd.car-auction.v1+json)
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const headerMatch = acceptHeader.match(/vnd\.car-auction\.v(\d+)/);
    if (headerMatch) {
      return parseInt(headerMatch[1]);
    }
  }

  // Check custom header
  const versionHeader = req.get('API-Version');
  if (versionHeader) {
    return parseInt(versionHeader);
  }

  // Default to latest version
  return 2;
}

/**
 * API Version Middleware
 */
function apiVersionMiddleware(req, res, next) {
  req.apiVersion = extractApiVersion(req);
  res.set('API-Version', req.apiVersion);
  next();
}

/**
 * Deprecation Warning Middleware
 */
function deprecationMiddleware(deprecatedVersion, sunsetDate) {
  return (req, res, next) => {
    if (req.apiVersion === deprecatedVersion) {
      res.set('Deprecated', 'true');
      res.set('Sunset', sunsetDate);
      res.set('Link', `</api/v${deprecatedVersion + 1}>; rel="successor-version"`);
      
      console.warn(`Deprecated API version ${deprecatedVersion} used`, {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
    next();
  };
}

/**
 * Version-specific route handler
 */
function versionedRoute(handlers) {
  return (req, res, next) => {
    const version = req.apiVersion || 2;
    const handler = handlers[`v${version}`] || handlers.default;

    if (!handler) {
      return res.status(400).json({
        error: 'Unsupported API version',
        supported: Object.keys(handlers).filter(k => k !== 'default')
      });
    }

    handler(req, res, next);
  };
}

module.exports = {
  apiVersionMiddleware,
  deprecationMiddleware,
  versionedRoute,
  extractApiVersion
};
