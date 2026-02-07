// [[ARABIC_HEADER]] هذا الملف (vercel-server.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// Vercel entrypoint
// Route all requests to the serverless handler exported from server.js.
const handler = require('./server');

// Ensure we export the handler function for Vercel
module.exports = handler;
