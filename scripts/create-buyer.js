// [[ARABIC_HEADER]] هذا الملف (scripts/create-buyer.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createBuyer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Check if user exists
        const existing = await User.findOne({ email: 'daoodalhadid@gmail.com' });
        if (existing) {
            console.log('User already exists!');
            await mongoose.disconnect();
            return;
        }

        // Create new buyer
        const buyer = new User({
            name: 'داوود الحاشدي',
            email: 'daoodalhadid@gmail.com',
            password: 'password123', // Will be hashed automatically
            role: 'buyer',
            status: 'active'
        });

        await buyer.save();

        console.log('✅ Buyer created successfully!');
        console.log('  Name:', buyer.name);
        console.log('  Email:', buyer.email);
        console.log('  Password: password123');
        console.log('  Role:', buyer.role);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createBuyer();
