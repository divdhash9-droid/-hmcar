// [[ARABIC_HEADER]] هذا الملف (scripts/create-test-users.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.


const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createTestUsers() {
    try {
        console.log('🔄 Creating/Updating test users...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');

        // 1. Create/Update Admin
        const adminEmail = 'admin@hmcar.com';
        const adminPass = 'Admin@123';
        const hashedAdminPass = await bcrypt.hash(adminPass, 10);

        await User.findOneAndUpdate(
            { email: adminEmail },
            {
                name: 'Admin User',
                email: adminEmail,
                password: hashedAdminPass,
                role: 'admin',
                status: 'active',
                permissions: ['manage_users', 'manage_cars', 'manage_auctions', 'manage_settings']
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Admin user ready: ${adminEmail} / ${adminPass}`);

        // 2. Create/Update Client (Buyer)
        const clientEmail = 'client@hmcar.com';
        const clientPass = 'Client@123';
        const hashedClientPass = await bcrypt.hash(clientPass, 10);

        await User.findOneAndUpdate(
            { email: clientEmail },
            {
                name: 'Test Client',
                email: clientEmail,
                password: hashedClientPass,
                role: 'buyer',
                status: 'active'
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Client user ready: ${clientEmail} / ${clientPass}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createTestUsers();
