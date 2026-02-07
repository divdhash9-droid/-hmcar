'use strict';

// Minimal asset helper used by config/serverConfig.js and server.js.
// The project currently relies on this for cache/static settings.

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function getCacheSettings() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Allow override via env when deploying behind CDNs.
  // Defaults are conservative in production and disabled in development.
  const maxAgeSeconds = Number.parseInt(process.env.STATIC_MAX_AGE_SECONDS || '', 10);
  const maxAge = Number.isFinite(maxAgeSeconds) && maxAgeSeconds >= 0
    ? `${maxAgeSeconds}s`
    : (isDevelopment ? 0 : '1h');

  const etag = parseBool(process.env.STATIC_ETAG, true);
  const lastModified = parseBool(process.env.STATIC_LAST_MODIFIED, true);
  const immutable = parseBool(process.env.STATIC_IMMUTABLE, !isDevelopment);

  return { maxAge, etag, lastModified, immutable };
}

module.exports = {
  getCacheSettings,
};
