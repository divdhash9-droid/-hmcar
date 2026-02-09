
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/car-auction';

async function createSuperAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = process.argv[2] || 'admin@hmcar.com';
        const password = process.argv[3] || 'admin123';
        const name = 'Super Admin';

        console.log(`Creating/Updating Super Admin: ${email}`);

        let admin = await User.findOne({ email });

        if (admin) {
            console.log('User exists. Promoting to super_admin...');
            admin.role = 'super_admin';
            admin.permissions = ['super_admin'];
            if (process.argv[3]) {
                admin.password = password; // Only update if explicitly provided
                console.log('Password updated.');
            }
        } else {
            console.log('Creating new user...');
            admin = new User({
                name,
                email,
                phone: '+966500000000',
                password,
                role: 'super_admin',
                permissions: ['super_admin'],
                status: 'active',
                isDeviceLocked: false // Admin shouldn't be locked out initially
            });
        }

        await admin.save();
        console.log('✅ Super Admin configured successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('You can now log in at /login.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

createSuperAdmin();
