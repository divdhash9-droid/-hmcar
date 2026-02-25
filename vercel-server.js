// [[ARABIC_HEADER]] هذا الملف (vercel-server.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * vercel-server.js
 * HM CAR - Vercel Serverless Entry Point
 * يتصل بـ MongoDB Atlas ويُشغّل تطبيق Express.
 */

const mongoose = require('mongoose');

let cachedApp = null;
let dbConnected = false;
let adminSeeded = false;

async function connectDB() {
    if (dbConnected && mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGO_URI;
    if (!uri || uri.startsWith('memory://')) {
        throw new Error('MONGO_URI must be a valid MongoDB Atlas URI in production');
    }

    await mongoose.connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 8000,
        bufferCommands: false,
    });

    dbConnected = true;
    console.log('✅ MongoDB Atlas connected:', mongoose.connection.host);

    // إنشاء حساب الأدمن والبيانات الحقيقية
    await seedProductionAdmin();
    await seedRealData();
}

/**
 * يُنشئ حساب المشرف الرئيسي في Atlas إذا لم يكن موجوداً
 */
async function seedProductionAdmin() {
    if (adminSeeded) return;
    try {
        const User = require('./models/User');
        const adminEmail = process.env.PROD_ADMIN_EMAIL || 'admin@hmcar.com';
        const existing = await User.findOne({ email: adminEmail });

        if (!existing) {
            const admin = new User({
                name: process.env.PROD_ADMIN_NAME || 'HM Admin',
                email: adminEmail,
                password: process.env.PROD_ADMIN_PASSWORD || 'HmCar@2026!',
                role: 'super_admin',
                status: 'active',
                createdVia: 'admin-created',
                permissions: [
                    'manage_users', 'manage_settings', 'manage_footer',
                    'manage_whatsapp', 'manage_cars', 'manage_parts',
                    'manage_auctions', 'manage_concierge', 'view_analytics',
                    'manage_content', 'super_admin'
                ]
            });
            await admin.save();
            console.log('👤 Production admin created:', adminEmail);
        }
    } catch (e) {
        console.warn('⚠️ Admin seed warning:', e.message);
    }
}

/**
 * إضافة بيانات سيارات ومزادات حقيقية إذا كانت القاعدة فارغة
 */
async function seedRealData() {
    if (adminSeeded) return; // نستخدم نفس العلم لمنع التكرار في نفس الجلسة
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
                carId: porsche._id,
                startPrice: 850000,
                currentPrice: 850000,
                minIncrement: 5000,
                startTime: new Date(),
                endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'active',
                title: 'Premium Auction: Porsche 911 Turbo S'
            });
        }
        console.log('✅ Real data seeding complete.');
    } catch (e) {
        console.warn('⚠️ Data seed warning:', e.message);
    }
}

function buildApp() {
    if (cachedApp) return cachedApp;
    const App = require('./modules/app');
    const instance = new App();
    cachedApp = instance.app;
    return cachedApp;
}

// Vercel serverless handler
module.exports = async (req, res) => {
    try {
        await connectDB();
        const app = buildApp();
        return app(req, res);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server initialization failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
