// [[ARABIC_HEADER]] هذا الملف (scripts/fixBuyerNameKeys.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const User = require('../models/User');

async function fixBuyerNameKeys() {
  try {
    console.log('🔧 Fixing buyerNameKey for existing users...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');
    console.log('✅ Connected to database');

    // Find all buyer users without buyerNameKey
    const usersWithoutKey = await User.find({
      role: 'buyer',
      buyerNameKey: { $exists: false }
    });

    console.log(`📊 Found ${usersWithoutKey.length} users without buyerNameKey`);

    // Update each user
    for (const user of usersWithoutKey) {
      user.buyerNameKey = user.name.toLowerCase();
      await user.save();
      console.log(`✅ Updated: ${user.name} -> ${user.buyerNameKey}`);
    }

    console.log('🎉 All buyerNameKey fixes completed!');

  } catch (error) {
    console.error('❌ Error fixing buyerNameKey:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  fixBuyerNameKeys()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fixBuyerNameKeys };