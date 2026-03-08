// [[ARABIC_HEADER]] هذا الملف (vercel-server.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * vercel-server.js
 * HM CAR - Vercel Serverless Entry Point
 * يتصل بـ MongoDB Atlas ويُشغّل تطبيق Express مباشرة (بدون تعقيدات modules/app.js).
 */

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

let cachedApp = null;
let dbConnected = false;
let adminSeeded = false;

async function connectDB() {
    if (dbConnected && mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri || uri.startsWith('memory://')) {
        throw new Error('Database connection string (MONGO_URI/MONGODB_URI) must be provided in production');
    }

    console.log('[Vercel] Connecting to MongoDB...');
    await mongoose.connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 8000,
        bufferCommands: false,
    });

    dbConnected = true;
    console.log('✅ MongoDB Atlas connected:', mongoose.connection.host);

    // إنشاء حساب الأدمن والبيانات الحقيقية والإعدادات الافتراضية
    await seedProductionAdmin();
    await seedRealData();
    await seedDefaultSettings();
}

/**
 * يُنشئ حساب المشرف الرئيسي في Atlas إذا لم يكن موجوداً
 * ⚠️ مهم: لا يُعدَّل أي بيانات موجودة - يحفظها كما هي
 */
async function seedProductionAdmin() {
    try {
        const User = require('./models/User');

        // ─── الأدمن الرئيسي: أنشئه فقط إذا لم يكن موجوداً ───
        const adminExists = await User.findOne({
            $or: [{ email: 'admin@hmcar.com' }, { username: 'admin' }]
        });

        if (!adminExists) {
            // إنشاء أول مرة فقط - لن يُعاد إنشاؤه أبداً
            const admin = new User({
                name: 'HM Admin',
                email: 'admin@hmcar.com',
                username: 'admin',
                password: 'HmCar@2026!',
                role: 'super_admin',
                status: 'active',
                permissions: ['super_admin', 'manage_users', 'manage_settings', 'manage_cars', 'manage_parts', 'manage_auctions', 'view_analytics', 'manage_content', 'manage_footer', 'manage_whatsapp', 'manage_concierge']
            });
            await admin.save();
            console.log('✅ [ONCE] Admin created: admin@hmcar.com');
        } else {
            // الأدمن موجود - لا تمسه! فقط تأكد أنه نشط
            // لا تغيّر كلمة المرور أو الإيميل أو أي بيانات أخرى
            if (adminExists.status === 'suspended') {
                await User.updateOne(
                    { _id: adminExists._id },
                    { $set: { status: 'active' } }
                );
                console.log('✅ Admin status restored to active (was suspended)');
            } else {
                console.log('✅ Admin already exists - data preserved as-is');
            }
        }

        // ─── أدمن احتياطي: أنشئه فقط إذا لم يكن موجوداً ───
        const masterExists = await User.findOne({ username: 'master_admin' });

        if (!masterExists) {
            const master = new User({
                name: 'Master Admin',
                email: 'master@hmcar.com',
                username: 'master_admin',
                password: 'HmCar@2026!',
                role: 'super_admin',
                status: 'active',
                permissions: ['super_admin']
            });
            await master.save();
            console.log('✅ [ONCE] Master Admin created: master_admin');
        } else {
            console.log('✅ Master Admin already exists - data preserved as-is');
        }

    } catch (e) {
        console.warn('⚠️ Admin seed warning:', e.message);
    }
}

/**
 * إضافة بيانات سيارات ومزادات حقيقية إذا كانت القاعدة فارغة
 */
async function seedRealData() {
    if (adminSeeded) return;
    adminSeeded = true;

    try {
        const Car = require('./models/Car');
        const count = await Car.countDocuments();
        if (count > 0) return;

        console.log('🌱 Seeding real data into Production Atlas...');

        const cars = [
            {
                title: 'Mercedes-Benz G63 AMG 2024',
                make: 'Mercedes',
                model: 'G63',
                year: 2024,
                price: 850000,
                priceSar: 850000,
                images: ['https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&q=80&w=800'],
                description: 'The ultimate luxury off-roader.',
                fuelType: 'Petrol',
                transmission: 'Automatic',
                color: 'Metallic Black',
                condition: 'excellent',
                isActive: true,
                listingType: 'store'
            },
            {
                title: 'Porsche 911 Turbo S 2023',
                make: 'Porsche',
                model: '911',
                year: 2023,
                price: 920000,
                priceSar: 920000,
                images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'],
                description: 'Master of German engineering.',
                fuelType: 'Petrol',
                transmission: 'Automatic',
                color: 'Silver',
                condition: 'excellent',
                isActive: true,
                listingType: 'auction'
            }
        ];

        const createdCars = await Car.create(cars);

        // إضافة مزاد نشط
        const Auction = require('./models/Auction');
        const porsche = createdCars.find(c => c.model === '911');
        if (porsche) {
            await Auction.create({
                car: porsche._id,           // الحقل الصحيح هو 'car' وليس 'carId'
                startingPrice: 850000,       // الحقل الصحيح هو 'startingPrice' وليس 'startPrice'
                currentPrice: 850000,
                startsAt: new Date(),        // الحقل الصحيح هو 'startsAt' وليس 'startTime'
                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 'endsAt' وليس 'endTime'
                status: 'running',           // القيم الصحيحة: 'scheduled', 'running', 'ended'
                currency: 'SAR'
            });
        }

        console.log('✅ Real data seeding complete.');
    } catch (e) {
        console.warn('⚠️ Data seed warning:', e.message);
    }
}

/**
 * تهيئة إعدادات الموقع الافتراضية
 */
async function seedDefaultSettings() {
    try {
        const SiteSettings = require('./models/SiteSettings');
        const existing = await SiteSettings.findOne({ key: 'main' });

        if (!existing || !existing.socialLinks?.whatsapp || !existing.features?.length) {
            await SiteSettings.findOneAndUpdate(
                { key: 'main' },
                {
                    $set: {
                        'socialLinks.whatsapp': '+967781007805',
                        'contactInfo.phone': '+967781007805',
                        'contactInfo.email': 'info@hmcar.com',
                        'siteInfo.siteName': 'HM CAR',
                        'siteInfo.siteDescription': 'منصة مزادات ومبيعات السيارات الفاخرة',
                        'currencySettings.usdToSar': 3.75,
                        'currencySettings.usdToKrw': 1350,
                        'features': [
                            { icon: 'Shield', title: 'ضمان شامل', titleEn: 'Full Warranty', desc: 'ضمان شامل على جميع السيارات', descEn: 'Comprehensive warranty on all cars' },
                            { icon: 'Truck', title: 'شحن عالمي', titleEn: 'Global Shipping', desc: 'توصيل إلى أي مكان في العالم', descEn: 'Delivery to anywhere worldwide' },
                            { icon: 'CreditCard', title: 'دفع آمن', titleEn: 'Secure Payment', desc: 'طرق دفع متعددة وآمنة', descEn: 'Multiple secure payment methods' },
                            { icon: 'Award', title: 'فحص شامل', titleEn: 'Full Inspection', desc: 'فحص 200 نقطة للسيارات', descEn: '200-point vehicle inspection' },
                            { icon: 'Zap', title: 'مزايدة سريعة', titleEn: 'Quick Bid', desc: 'نظام مزايدة فوري وسريع', descEn: 'Instant and fast bidding system' },
                            { icon: 'Globe', title: 'سيارات كورية', titleEn: 'Korean Cars', desc: 'أفضل السيارات الكورية', descEn: 'Best Korean vehicles' }
                        ]
                    }
                },
                { upsert: true, new: true }
            );
            console.log('✅ Default site settings initialized with KRW and Features');
        }
    } catch (e) {
        console.warn('⚠️ Settings seed warning:', e.message);
    }
}

/**
 * بناء تطبيق Express مستقل لـ Vercel (بدون الاعتماد على modules/app.js)
 * هذا يتجنب مشاكل التحميل مع socket.io وغيرها في بيئة serverless
 */
function buildApp() {
    if (cachedApp) return cachedApp;

    console.log('[Vercel] Building Express app...');
    const app = express();

    // ── Middleware ──
    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
                return callback(null, true);
            }
            const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
            callback(allowed.includes(origin) ? null : new Error('CORS blocked'), allowed.includes(origin));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    app.use(compression());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ── Diagnostic Check ──
    app.get('/api/diag', async (req, res) => {
        let adminStatus = 'Unknown';
        try {
            const User = require('./models/User');
            const admin = await User.findOne({
                $or: [{ email: 'admin@hmcar.com' }, { username: 'admin' }]
            });
            adminStatus = admin ? `Found (Email: ${admin.email}, Role: ${admin.role}, Status: ${admin.status})` : 'Not Found';
        } catch (e) {
            adminStatus = 'Error checking: ' + e.message;
        }

        res.json({
            status: 'diagnostic',
            timestamp: new Date(),
            engine: 'HM-CAR-V2-Vercel',
            database: {
                status: mongoose.connection.readyState === 1 ? 'متصل' : 'مفصول',
                name: mongoose.connection.name
            },
            diagnostics: {
                adminStatus,
                env_keys: Object.keys(process.env).filter(k => k.includes('ADMIN') || k.includes('URL') || k.includes('URI'))
            }
        });
    });

    // ── API الرئيسي ──
    app.get('/', (req, res) => {
        res.json({
            message: 'مرحباً بك في واجهة برمجة تطبيقات HM CAR V2',
            status: 'Online',
            documentation: '/api/v2/docs'
        });
    });

    // ── تحميل مسارات API v2 مباشرة ──
    try {
        const apiV2Router = require('./routes/api/v2/index');
        app.use('/api/v2', apiV2Router);
        app.use('/v2', apiV2Router);
        app.use('/api', apiV2Router);
        console.log('✅ API v2 routes loaded successfully');
    } catch (error) {
        console.error('❌ CRITICAL: Failed to load API v2 routes:', error.message);
        console.error(error.stack);
        // إضافة مسار طوارئ يوضح الخطأ
        app.use('/api', (req, res) => {
            res.status(500).json({
                success: false,
                message: 'فشل تحميل مسارات API',
                error: error.message
            });
        });
    }

    // ── 404 Handler ──
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'عذراً، المسار المطلوب غير موجود',
            path: req.originalUrl,
            code: 'NOT_FOUND'
        });
    });

    // ── Error Handler ──
    app.use((err, req, res, next) => {
        console.error('⚠️ خطأ غير متوقع:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ تقني داخلي في الخادم',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
        });
    });

    cachedApp = app;
    console.log('[Vercel] Express app built successfully');
    return app;
}

// Vercel serverless handler
module.exports = async (req, res) => {
    try {
        await connectDB();
        const app = buildApp();
        return app(req, res);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
        return res.status(500).json({
            success: false,
            message: 'Server initialization failed',
            error: error.message
        });
    }
};
