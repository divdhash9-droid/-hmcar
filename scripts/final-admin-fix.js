
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function main() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hmcar.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!mongoUri) {
        throw new Error('Missing MONGO_URI (or MONGODB_URI) environment variable.');
    }

    if (!adminPassword) {
        throw new Error('Missing ADMIN_PASSWORD environment variable.');
    }

    console.log('🔄 Connecting to database...');
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected.');

        let admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log('👤 Admin exists. Updating...');
            admin.password = adminPassword;
            admin.role = 'super_admin';
            admin.status = 'active';
            await admin.save();
            console.log('✅ Admin updated.');
        } else {
            console.log('👤 Admin not found. Creating...');
            await User.create({
                name: 'HM Admin',
                email: adminEmail,
                username: 'admin',
                password: adminPassword,
                role: 'super_admin',
                status: 'active'
            });
            console.log('✅ Admin created.');
        }

        console.log('\n=======================================');
        console.log('  Login: ' + adminEmail);
        console.log('  Password: set from ADMIN_PASSWORD');
        console.log('  URL:   https://car-auction-sand.vercel.app/login');
        console.log('=======================================\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

main();
