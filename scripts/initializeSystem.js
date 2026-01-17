// [[ARABIC_HEADER]] هذا الملف (scripts/initializeSystem.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { getDefaultPermissions } = require('../middleware/permissions');

async function initializeSystem() {
  try {
    console.log('🚀 Initializing system...');

    // Skip initialization in development for faster startup
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ Development mode - skipping system initialization for faster startup');
      return;
    }

    // Check if database is available
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ Database not available - skipping system initialization');
      return;
    }

    // إنشاء أو تحديث الإعدادات الافتراضية (باستخدام findOneAndUpdate للأسرع)
    let settings = await Settings.findOneAndUpdate(
      {},
      { $setOnInsert: { /* default settings */ } },
      { upsert: true, new: true }
    );
    console.log('✅ Settings initialized');

    // التحقق من وجود Super Admin (باستخدام findOneAndUpdate للأسرع)
    const superAdmin = await User.findOneAndUpdate(
      { role: 'super_admin' },
      { 
        $setOnInsert: {
          name: 'مدير النظام',
          email: 'superadmin@localhost.com',
          phone: '+966500000002',
          password: 'Admin@123',
          role: 'super_admin',
          permissions: getDefaultPermissions('super_admin'),
          status: 'active'
        }
      },
      { upsert: true, new: true }
    );
    
    if (superAdmin.isNew) {
      console.log('✅ Default Super Admin created:');
      console.log('   Email: superadmin@localhost.com');
      console.log('   Password: Admin@123');
      console.log('   Phone: +966500000002');
    } else {
      console.log('✅ Super Admin already exists');
    }

    // تحديث المستخدمين الحاليين بالصلاحيات الافتراضية (باستخدام updateMany للأسرع)
    const result = await User.updateMany(
      { 
        role: { $in: ['admin', 'manager'] },
        permissions: { $exists: false }
      },
      { $set: { permissions: getDefaultPermissions('admin') } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated permissions for ${result.modifiedCount} users`);
    }

    console.log('🎉 System initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing system:', error);
    throw error;
  }
}

module.exports = { initializeSystem };
