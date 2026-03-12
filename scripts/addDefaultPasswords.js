// [[ARABIC_HEADER]] هذا الملف (scripts/addDefaultPasswords.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');

async function addDefaultPasswords() {
  try {
    console.log('🔐 Adding default passwords for users without passwords...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');
    console.log('✅ Connected to database');

    // Find all users without passwords
    const usersWithoutPassword = await User.find({
      password: { $exists: false }
    });

    console.log(`📊 Found ${usersWithoutPassword.length} users without passwords`);

    // Use explicit env password or generate a temporary one for this run.
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Update each user
    for (const user of usersWithoutPassword) {
      user.password = hashedPassword;
      await user.save();
      console.log(`✅ Added password for: ${user.name}`);
    }

    console.log('🎉 All password additions completed!');
    console.log(`🔑 Default password for all users: ${defaultPassword}`);

  } catch (error) {
    console.error('❌ Error adding passwords:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  addDefaultPasswords()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { addDefaultPasswords };