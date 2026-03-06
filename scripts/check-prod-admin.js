
const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
require('dotenv').config({ path: '.env' });

async function checkProductionAdmin() {
    try {
        console.log('Connecting to production database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const admins = await User.find({ role: { $in: ['admin', 'super_admin', 'manager'] } }).select('email username role status');
        console.log(`Found ${admins.length} admins:`);
        console.log(JSON.stringify(admins, null, 2));

        console.log('\nChecking recent failed login attempts:');
        const failedLogins = await AuditLog.find({ action: 'LOGIN', result: 'FAILURE' })
            .sort({ timestamp: -1 })
            .limit(5);
        console.log(JSON.stringify(failedLogins, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProductionAdmin();
