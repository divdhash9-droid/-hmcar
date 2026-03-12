// [[ARABIC_HEADER]] هذا الملف (scripts/createProductionAdmin.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * createProductionAdmin.js
 * سكريبت لإنشاء حساب المشرف الرئيسي في قاعدة بيانات الإنتاج (MongoDB Atlas)
 * 
 * الاستخدام:
 *   MONGO_URI="mongodb+srv://..." node scripts/createProductionAdmin.js
 * 
 * أو عبر npm:
 *   npm run create:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ADMIN_DATA = {
    name: process.env.PROD_ADMIN_NAME || 'HM Admin',
    email: process.env.PROD_ADMIN_EMAIL || 'admin@hmcar.com',
    username: 'admin',
    password: process.env.PROD_ADMIN_PASSWORD,
    role: 'super_admin',
    status: 'active',
    permissions: [
        'manage_users', 'manage_settings', 'manage_footer',
        'manage_whatsapp', 'manage_cars', 'manage_parts',
        'manage_auctions', 'manage_concierge', 'view_analytics',
        'manage_content', 'super_admin'
    ]
};

async function run() {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.startsWith('memory://')) {
        console.error('❌ يجب تعيين MONGO_URI لقاعدة بيانات Atlas حقيقية!');
        console.error('   مثال: MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/car-auction" node scripts/createProductionAdmin.js');
        process.exit(1);
    }

    if (!process.env.PROD_ADMIN_PASSWORD) {
        console.error('❌ يجب تحديد كلمة المرور الخاصة بالأدمن في متغير PROD_ADMIN_PASSWORD');
        process.exit(1);
    }

    console.log('🔄 جاري الاتصال بـ MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ متصل بـ Atlas:', mongoose.connection.host);

    // نستخدم نموذج User مباشرة
    const User = require('../models/User');

    // هل الأدمن موجود بالفعل؟
    const existing = await User.findOne({ email: ADMIN_DATA.email });

    if (existing) {
        console.log(`⚠️  الأدمن موجود بالفعل (${existing.email}), جاري تحديث كلمة المرور والصلاحيات...`);
        existing.password = ADMIN_DATA.password;         // سيُشفَّر تلقائياً بـ pre-save hook
        existing.role = ADMIN_DATA.role;
        existing.status = ADMIN_DATA.status;
        existing.permissions = ADMIN_DATA.permissions;
        await existing.save();
        console.log('✅ تم تحديث حساب الأدمن بنجاح!');
    } else {
        const admin = new User(ADMIN_DATA);
        await admin.save();
        console.log('✅ تم إنشاء حساب الأدمن بنجاح!');
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  بيانات تسجيل دخول الأدمن:');
    console.log('═══════════════════════════════════════');
    console.log(`  البريد الإلكتروني: ${ADMIN_DATA.email}`);
    console.log(`  كلمة المرور:       ${ADMIN_DATA.password}`);
    console.log(`  الدور:             ${ADMIN_DATA.role}`);
    console.log('═══════════════════════════════════════');
    console.log('');

    await mongoose.disconnect();
    console.log('✅ تم قطع الاتصال. جاهز للنشر!');
}

run().catch(err => {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
});
