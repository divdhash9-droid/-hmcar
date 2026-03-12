
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.production' });

async function repairAdmin() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ No MONGO_URI found in .env or .env.production');
        process.exit(1);
    }

    try {
        console.log('🔄 Connecting to database...');
        await mongoose.connect(uri);

        const User = require('../models/User');

        const adminEmail = process.env.PROD_ADMIN_EMAIL || 'admin@hmcar.com';
        const newPassword = process.env.PROD_ADMIN_PASSWORD;

        if (!newPassword) {
            console.error('❌ PROD_ADMIN_PASSWORD environment variable is missing.');
            process.exit(1);
        }

        let user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log(`👤 Found admin: ${adminEmail}. Updating password and status...`);
            user.password = newPassword;
            user.role = 'super_admin';
            user.status = 'active';
            await user.save();
            console.log('✅ Admin account updated successfully!');
        } else {
            console.log(`👤 Admin ${adminEmail} not found. Creating new one...`);
            await User.create({
                name: 'HM Admin',
                email: adminEmail,
                username: 'admin',
                password: newPassword,
                role: 'super_admin',
                status: 'active'
            });
            console.log('✅ Admin account created successfully!');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

repairAdmin();
