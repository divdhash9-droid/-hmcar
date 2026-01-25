// [[ARABIC_HEADER]] هذا الملف (server.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

﻿require('dotenv').config();
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');
const http = require('http');
const compression = require('compression');

const swaggerDocument = require('./swagger.json');
const { initializeSystem } = require('./scripts/initializeSystem');
const webSocketService = require('./services/WebSocketService');

// Internationalization setup
const i18n = require('i18n');
i18n.configure({
  locales: ['en', 'ar'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'ar',
  objectNotation: true,
  cookie: 'locale',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  syncFiles: true
});

// Routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const adminRoutes = require('./routes/admin');
const auctionsRoutes = require('./routes/auctions');
const bidsRoutes = require('./routes/bids');
const carsRoutes = require('./routes/cars');
const comparisonsRoutes = require('./routes/comparisons');
const favoritesRoutes = require('./routes/favorites');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const reportsRoutes = require('./routes/reports');
const reviewsRoutes = require('./routes/reviews');
const searchRoutes = require('./routes/search');
const shoppingRoutes = require('./routes/shopping');
const sitemapRoutes = require('./routes/sitemap');
const sparePartsRoutes = require('./routes/spareParts');
const superAdminRoutes = require('./routes/superAdmin');
const supportRoutes = require('./routes/support');
const analyticsRoutes = require('./routes/analytics');
// const backupRoutes = require('./routes/backup');
// const auditRoutes = require('./routes/audit');
// const permissionsRoutes = require('./routes/permissions');
const apiV2Routes = require('./routes/api/v2');
const apiCarsRoutes = require('./routes/api/cars');

// Configuration
const serverConfig = require('./config/serverConfig');
const assetHelper = require('./helpers/assetHelper');

// Database connection
const { connectDB } = require('./config/database');

// Models
const Car = require('./models/Car');
const Auction = require('./models/Auction');
const User = require('./models/User');
const Brand = require('./models/Brand');
const Review = require('./models/Review');

const app = express();

// Trust reverse proxy headers (required on Vercel for secure cookies/sessions)
if (process.env.VERCEL || process.env.NOW_REGION || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Cookies (must be before any middleware that reads req.cookies)
app.use(cookieParser());

// Initialize i18n
app.use(i18n.init);

// Locale selection middleware
app.use((req, res, next) => {
  let locale = (req.query && req.query.lang) ? String(req.query.lang).trim().toLowerCase() : '';
  if (!locale) {
    locale = (req.cookies && req.cookies.locale) ? String(req.cookies.locale).trim().toLowerCase() : '';
  }
  if (!locale) {
    const acceptLanguage = req.headers['accept-language'] || '';
    locale = acceptLanguage.includes('ar') ? 'ar' : 'en';
  }

  if (!['ar', 'en'].includes(locale)) {
    locale = 'ar';
  }

  req.setLocale(locale);
  res.locals.locale = locale;

  res.cookie('locale', locale, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax'
  });

  next();
});

// Rate limiting using server config
const limiter = rateLimit(serverConfig.security.rateLimit);
app.use(limiter);

// Basic security
app.disable('x-powered-by');
app.use(helmet());

// Body parsing and method override
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
  if (req.headers['x-http-method-override']) {
    return req.headers['x-http-method-override'];
  }
}));

// Compression middleware for performance
app.use(compression());

// Logging using server config
const loggerConfig = serverConfig.getLoggerConfig();
app.use(morgan(loggerConfig.format, { skip: loggerConfig.skip }));

// Rate limiters (more permissive in development)
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: process.env.NODE_ENV === 'development' ? 1000 : 120, standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === 'development' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'development' ? 500 : 100, standardHeaders: true, legacyHeaders: false });
const bidsLimiter = rateLimit({ windowMs: 60 * 1000, max: process.env.NODE_ENV === 'development' ? 200 : 30, standardHeaders: true, legacyHeaders: false });

const limiterBypassPrefixes = ['/public', '/uploads', '/socket.io', '/vendor'];
app.use((req, res, next) => {
  const p = req.path || '';
  if (limiterBypassPrefixes.some(prefix => p.startsWith(prefix))) {
    return next();
  }
  return globalLimiter(req, res, next);
});

// Device id
app.use((req, res, next) => {
  const cookieName = 'hm_device_id';
  let deviceId = (req.cookies && req.cookies[cookieName]) ? String(req.cookies[cookieName]).trim() : '';
  if (!deviceId) {
    deviceId = require('crypto').randomBytes(16).toString('hex');
    res.cookie(cookieName, deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
  }
  req.deviceId = deviceId;
  next();
});

// Sanitize Mongo queries
app.use(mongoSanitize());

// Security headers using server config
app.use((req, res, next) => {
  const isEmbed = String(req.query?.embed || '') === '1';
  
  // تطبيق إعدادات Helmet
  helmet(serverConfig.security.helmet)(req, res, () => {
    // إعدادات إضافية مخصصة
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', isEmbed ? 'SAMEORIGIN' : 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // تعديل CSP حسب البيئة
    const cspDirectives = serverConfig.security.helmet.contentSecurityPolicy.directives;
    const cspValue = Object.entries(cspDirectives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
    
    res.setHeader('Content-Security-Policy', cspValue);
    next();
  });
});

// Static files with unified configuration
const staticConfig = serverConfig.getStaticFileConfig();

app.use('/public', express.static(path.join(__dirname, 'public'), staticConfig));
app.use('/css', express.static(path.join(__dirname, 'public/css'), staticConfig));
app.use('/js', express.static(path.join(__dirname, 'public/js'), staticConfig));
app.use('/images', express.static(path.join(__dirname, 'public/images'), staticConfig));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  ...staticConfig,
  maxAge: '7d' // أطول فترة للملفات المرفوعة
}));
app.use('/vendor/fontawesome', express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free'), staticConfig));
app.use('/vendor/bootstrap-icons', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons'), staticConfig));

// PWA assets should be available at the site root
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'images', 'favicon.ico'));
});

// Session configuration using server config
app.use(session(serverConfig.session));

app.use(flash());

// CSRF protection (skip APIs and socket)
const csrfProtection = csurf();
app.use((req, res, next) => {
  const p = req.path || '';
  if (p.startsWith('/api') || p.startsWith('/socket.io') || p.startsWith('/webhook')) {
    req.csrfToken = () => '';
    return next();
  }
  return csrfProtection(req, res, next);
});

// Locals for views
app.use((req, res, next) => {
  const allFlashes = req.flash();
  if (Object.keys(allFlashes).length > 0) {
    const firstKey = Object.keys(allFlashes)[0];
    res.locals.flash = { type: firstKey, message: allFlashes[firstKey][0] };
  } else {
    res.locals.flash = null;
  }
  res.locals.currentUser = req.session.user;
  res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
    res.locals.currentUrl = req.originalUrl || req.url || '';
  next();
});

// View engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Simple home
app.get('/', async (req, res) => {
  try {
    let cars = [], brands = [], stats = null, liveAuctions = [], recentReviews = [], featuredCars = [], siteSettings = {};

    // Check if we have local database
    if (global.localDB) {
      // Use local database operations
      cars = await global.localDB.Car.find({ isActive: true }) || [];
      brands = await global.localDB.Brand.find({}) || [];
      stats = {
        totalCars: cars.length,
        activeAuctions: 0,
        totalUsers: 0,
        completedAuctions: 0
      };
      liveAuctions = [];
      recentReviews = [];
      featuredCars = cars.slice(0, 8);
    } else {
      // Use MongoDB/Mongoose models
      // Get featured cars
      cars = await Car.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

      // Get brands for search
      brands = await Brand.find({})
        .sort({ name: 1 })
        .lean();

      // Get platform statistics
      const totalCars = await Car.countDocuments({ isActive: true });
      const now = new Date();
      const activeAuctions = await Auction.countDocuments({
        status: 'running',
        endsAt: { $gt: now }
      });
      const totalUsers = await User.countDocuments({});
      const completedAuctions = await Auction.countDocuments({ status: 'ended' });

      // Get live auctions
      liveAuctions = await Auction.find({
        status: 'running',
        endsAt: { $gt: now }
      })
        .populate({
          path: 'car'
        })
        .sort({ endsAt: 1 })
        .limit(3)
        .lean();

      // Get recent reviews
      recentReviews = await Review.find({ status: 'approved' })
        .populate('user', 'name')
        .populate('car', 'make model')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      stats = {
        totalCars,
        activeAuctions,
        totalUsers,
        completedAuctions
      };

      // جلب إعدادات الموقع
      const Settings = require('./models/Settings');
      const settings = await Settings.getSettings();
      siteSettings = settings ? settings.footer : {};

      // جلب السيارات المميزة للصفحة الرئيسية
      featuredCars = await Car.find({
        isActive: true,
        isSold: false,
        listingType: 'store'
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
    }

    res.render('home', {
      layout: 'layout',
      bodyClass: 'home',
      hideNavbar: true,
      hideFooter: true,
      cars,
      brands,
      stats,
      liveAuctions,
      recentReviews,
      featuredCars,
      currentUser: req.session.user,
      siteSettings
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('home', {
      layout: 'layout',
      bodyClass: 'home',
      hideNavbar: true,
      hideFooter: true,
      cars: [],
      brands: [],
      stats: null,
      liveAuctions: [],
      recentReviews: [],
      featuredCars: [],
      currentUser: req.session.user,
      siteSettings: {}
    });
  }
});

// About page
app.get('/about', (req, res) => {
  res.render('about', {
    layout: 'layout',
    bodyClass: 'about-page',
    title: 'About Us - Car Auction Platform'
  });
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact', {
    layout: 'layout',
    bodyClass: 'contact-page',
    title: 'Contact Us - Car Auction Platform'
  });
});

// Client Dashboard
app.get('/client/dashboard', async (req, res) => {
  // التحقق من تسجيل الدخول
  if (!req.session.user) {
    req.session.returnTo = '/client/dashboard';
    return res.redirect('/auth/login');
  }

  // لوحة العميل الأساسية أصبحت داخل /cars (buyer-dashboard)
  if (req.session.user && req.session.user.role === 'buyer') {
    return res.redirect('/cars');
  }

  try {
    const user = req.session.user;
    const Order = require('./models/Order');
    const Auction = require('./models/Auction');

    const [availableCars, myCars, ordersAll, ordersPending, liveAuctions] = await Promise.all([
      Car.countDocuments({ isSold: { $ne: true } }),
      Car.countDocuments({ isSold: true, soldTo: user._id }),
      Order.countDocuments({ buyer: user._id }),
      Order.countDocuments({ buyer: user._id, status: 'pending' }),
      Auction.countDocuments({ status: 'running' })
    ]);

    res.render('client/dashboard', {
      layout: 'layout',
      hideNavbar: true,
      fullWidth: true,
      bodyClass: 'hm-client-dashboard',
      currentUser: user,
      counts: { availableCars, myCars, ordersAll, ordersPending, liveAuctions }
    });
  } catch (error) {
    console.error('Error loading client dashboard:', error);
    res.render('client/dashboard', {
      layout: 'layout',
      hideNavbar: true,
      hideFooter: true,
      fullWidth: true,
      bodyClass: 'hm-client-dashboard',
      currentUser: req.session.user,
      counts: { availableCars: 0, myCars: 0, ordersAll: 0, ordersPending: 0, liveAuctions: 0 }
    });
  }
});

// API v2
app.use('/api/v2', apiV2Routes);

// Legacy/Client API for cars page
app.use('/api/cars', apiCarsRoutes);

// Mount routers
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/admin', adminRoutes);
app.use('/auctions', auctionsRoutes);
app.use('/bids', bidsRoutes);
app.use('/cars', carsRoutes);
app.use('/comparisons', comparisonsRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/messages', messagesRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/orders', ordersRoutes);
app.use('/payments', paymentsRoutes);
app.use('/reports', reportsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/search', searchRoutes);
app.use('/shopping', shoppingRoutes);
app.use('/sitemap', sitemapRoutes);
app.use('/spare-parts', sparePartsRoutes);
app.use('/super-admin', superAdminRoutes);
app.use('/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
// app.use('/backup', backupRoutes);
// app.use('/audit', auditRoutes);
// app.use('/permissions', permissionsRoutes);

// Not found handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'المورد غير موجود' });
  }
  return res.status(404).render('errors/404', { layout: 'layout', message: 'الصفحة غير موجودة' });
});

// Error handler
app.use((err, req, res, next) => {
  // Handle CSRF token errors gracefully
  if (err && err.code === 'EBADCSRFTOKEN') {
    const wantsJson = (req.path && req.path.startsWith('/api')) || (req.headers.accept && req.headers.accept.includes('application/json'));
    if (wantsJson) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    try {
      req.flash('error', 'انتهت صلاحية الجلسة أو رمز الحماية غير صحيح. حاول مرة أخرى.');
    } catch (_) {
      // ignore flash errors
    }

    const fallback = '/auth/login';
    const ref = req.get('Referrer');
    return res.redirect(ref || fallback);
  }

  console.error('Unhandled error:', err);
  if (req.path && req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
  return res.status(500).render('errors/500', { layout: 'layout', message: 'حدث خطأ في الخادم', error: err });
});

let serverInstance;
let appReady = false;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  try {
    const dbResult = await connectDB();
    if (dbResult && dbResult.type === 'local') {
      console.log('🏠 Running with local database - limited functionality available');
      // Store local database operations globally for use by models
      global.localDB = dbResult.operations;
      return dbResult.connection;
    }
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);

    // In development, allow app to start with limited functionality
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Starting app in offline mode - database features will be limited');
      return null;
    }
    throw error;
  }
}

async function startServer() {
  if (serverInstance && serverInstance.listening) return serverInstance;
  if (serverInstance && !serverInstance.listening) {
    serverInstance = undefined;
  }
  
  // التحقق من صحة الإعدادات
  const validation = serverConfig.validate();
  if (!validation.isValid) {
    console.error('❌ Configuration errors:', validation.errors);
    if (serverConfig.isProduction) {
      process.exit(1);
    }
  }
  
  await connectToDatabase();
  await initializeSystem();

  const port = serverConfig.port;
  const httpServer = http.createServer(app);
  
  if (typeof webSocketService.initialize === 'function') {
    webSocketService.initialize(httpServer);
    if (webSocketService.io) {
      app.set('io', webSocketService.io);
    }
  }

  // إظهار معلومات البيئة عند التشغيل
  const envInfo = serverConfig.getEnvironmentInfo();
  console.log('\n=== Server Environment Info ===');
  console.log(`Environment: ${envInfo.environment}`);
  console.log(`Port: ${port || 'Dynamic (Vercel)'}`);
  console.log(`Database: ${envInfo.databaseUri}`);
  console.log(`Node Version: ${envInfo.nodeVersion}`);
  console.log('===============================\n');

  if (port) {
    serverInstance = httpServer.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
      console.log(`🌍 Access URL: http://localhost:${port}`);
    });
  } else {
    // في بيئة Vercel، لا نحتاج لـ listen()
    serverInstance = httpServer;
    console.log('🚀 Server ready for Vercel deployment');
  }

  return serverInstance;
}

async function ensureAppReady() {
  if (appReady) return;
  await connectToDatabase();
  await initializeSystem();
  appReady = true;
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Vercel / serverless export
// Note: In serverless mode we must NOT call httpServer.listen().
const handler = async (req, res) => {
  try {
    await ensureAppReady();
    return app(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = handler;
module.exports.app = app;
module.exports.startServer = startServer;
