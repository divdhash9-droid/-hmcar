// [[ARABIC_HEADER]] هذا الملف (scripts/check-user.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testAdminLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Find admin user
        const admin = await User.findOne({ email: 'admin@hmcar.com' });

        if (admin) {
            console.log('✅ Admin found:');
            console.log('  Name:', admin.name);
            console.log('  Email:', admin.email);
            console.log('  Role:', admin.role);
            console.log('  Has password:', !!admin.password);

            // Test password - try common passwords
            const testPasswords = ['admin123', 'Admin123', '123456', 'password', 'admin'];

            console.log('\n🔐 Testing passwords...');
            for (const pwd of testPasswords) {
                try {
                    const isMatch = await admin.comparePassword(pwd);
                    if (isMatch) {
                        console.log(`✅ Password matched: "${pwd}"`);
                        break;
                    }
                } catch (e) {
                    // ignore
                }
            }
        } else {
            console.log('❌ Admin not found');
        }

        // Also show buyers with actual emails
        console.log('\n📋 Buyers with emails:');
        const buyers = await User.find({ role: 'buyer', email: { $exists: true, $ne: null } });
        buyers.forEach(u => {
            console.log(`  - ${u.name} | ${u.email}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminLogin();
