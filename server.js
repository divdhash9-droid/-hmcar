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

// Database connection
const { connectDB } = require('./config/database');

// Models
const Car = require('./models/Car');
const Auction = require('./models/Auction');
const User = require('./models/User');
const Brand = require('./models/Brand');
const Review = require('./models/Review');

const app = express();

// Cookies (must be before any middleware that reads req.cookies)
app.use(cookieParser());

// Initialize i18n
app.use(i18n.init);

// Language detection middleware
app.use((req, res, next) => {
  // Check for language in query parameter, cookie, or Accept-Language header
  const cookieLocale = req.cookies ? req.cookies.locale : undefined;
  let locale = req.query.lang || cookieLocale;
  
  if (!locale) {
    // Detect from Accept-Language header
    const acceptLanguage = req.headers['accept-language'] || '';
    locale = acceptLanguage.includes('ar') ? 'ar' : 'en';
  }
  
  // Validate locale
  if (!['ar', 'en'].includes(locale)) {
    locale = 'ar'; // Default to Arabic
  }
  
  // Set locale for i18n
  req.setLocale(locale);
  res.locals.locale = locale;
  
  // Save to cookie
  res.cookie('locale', locale, {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax'
  });
  
  next();
});

// Rate limiting (more permissive in development)
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // 1000 requests in dev, 100 in production
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => isDev // Skip rate limiting entirely in development
});
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

// Logging
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));

// Rate limiters (more permissive in development)
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: isDev ? 1000 : 120, standardHeaders: true, legacyHeaders: false, skip: () => isDev });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: isDev ? 500 : 100, standardHeaders: true, legacyHeaders: false });
const bidsLimiter = rateLimit({ windowMs: 60 * 1000, max: isDev ? 200 : 30, standardHeaders: true, legacyHeaders: false });

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

// Additional security headers
app.use((req, res, next) => {
  const isEmbed = String(req.query && req.query.embed ? req.query.embed : '') === '1';
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', isEmbed ? 'SAMEORIGIN' : 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self'; font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.gstatic.com data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors ${isEmbed ? "'self'" : "'none'"}`);
  next();
});

// Static files
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '1d', etag: true, lastModified: true, immutable: true }));
app.use('/css', express.static(path.join(__dirname, 'public/css'), { maxAge: '1d', immutable: true }));
app.use('/js', express.static(path.join(__dirname, 'public/js'), { maxAge: '1d', immutable: true }));
app.use('/images', express.static(path.join(__dirname, 'public/images'), { maxAge: '1d', immutable: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/vendor/fontawesome', express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free'), { maxAge: '1d', immutable: true }));
app.use('/vendor/bootstrap-icons', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons'), { maxAge: '1d', immutable: true }));

// PWA assets should be available at the site root
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Session configuration
const mongoUriForSession = (process.env.MONGO_URI && String(process.env.MONGO_URI).trim()) ? String(process.env.MONGO_URI).trim() : '';
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_here',
  resave: false,
  saveUninitialized: false,
  ...(mongoUriForSession ? { store: MongoStore.create({ mongoUrl: mongoUriForSession }) } : {}),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

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
    // Get featured cars
    const cars = await Car.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Get brands for search
    const brands = await Brand.find({})
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
    const liveAuctions = await Auction.find({
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
    const recentReviews = await Review.find({ status: 'approved' })
      .populate('user', 'name')
      .populate('car', 'make model')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const stats = {
      totalCars,
      activeAuctions,
      totalUsers,
      completedAuctions
    };

    // جلب إعدادات الموقع
    const Settings = require('./models/Settings');
    const settings = await Settings.getSettings();
    const siteSettings = settings ? settings.footer : {};

    // جلب السيارات المميزة للصفحة الرئيسية
    const featuredCars = await Car.find({ 
      isActive: true, 
      isSold: false,
      listingType: 'store'
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

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
      fullWidth: true,
      bodyClass: 'hm-client-dashboard',
      currentUser: req.session.user,
      counts: { availableCars: 0, myCars: 0, ordersAll: 0, ordersPending: 0, liveAuctions: 0 }
    });
  }
});

// API v2
app.use('/api/v2', apiV2Routes);

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
    await connectDB();
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // In production, we should still allow the app to start even if DB fails
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Starting app without database connection');
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
  await connectToDatabase();
  await initializeSystem();

  const port = process.env.PORT || 4001;
  const httpServer = http.createServer(app);
  if (typeof webSocketService.initialize === 'function') {
    webSocketService.initialize(httpServer);
    if (webSocketService.io) {
      app.set('io', webSocketService.io);
    }
  }

  serverInstance = httpServer.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });

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
