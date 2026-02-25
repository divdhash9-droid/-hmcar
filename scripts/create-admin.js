// [[ARABIC_HEADER]] هذا الملف (scripts/create-admin.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    const User = require(path.join(__dirname, '..', 'models', 'User'));

    // حذف المدراء القدامى
    await User.deleteMany({ role: { $in: ['admin', 'super_admin', 'manager'] } });
    console.log('🗑️ Deleted old admin users');

    // إنشاء admin جديد
    const admin = new User({
        name: 'Admin HM CAR',
        email: 'admin@hmcar.com',
        password: 'Admin123456!',
        role: 'super_admin',
        status: 'active',
        isActive: true
    });
    await admin.save();

    // تأكيد كلمة المرور
    const check = await User.findOne({ email: 'admin@hmcar.com' });
    const isValid = await check.comparePassword('Admin123456!');

    console.log('✅ Admin created:');
    console.log('   Email   :', check.email);
    console.log('   Role    :', check.role);
    console.log('   Password valid:', isValid);

    process.exit(0);
}).catch(e => {
    console.log('❌ Error:', e.message);
    process.exit(1);
});
