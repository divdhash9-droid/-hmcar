// [[ARABIC_HEADER]] هذا الملف (scripts/setup-production.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const { getDefaultPermissions } = require('../middleware/permissions');

async function setupProduction() {
  try {
    console.log('🚀 Setting up production environment...');

    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is required for production setup');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // 1. Create admin users
    console.log('\n👑 Creating admin users...');
    
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (!existingSuperAdmin) {
      const superAdminPassword = await bcrypt.hash('SuperAdmin@2026', 12);
      const superAdmin = new User({
        name: 'مدير النظام',
        email: 'superadmin@hmcar.com',
        phone: '+966500000001',
        password: superAdminPassword,
        role: 'super_admin',
        permissions: getDefaultPermissions('super_admin'),
        status: 'active',
        isEmailVerified: true
      });
      await superAdmin.save();
      console.log('✅ Super admin created: superadmin@hmcar.com / SuperAdmin@2026');
    } else {
      console.log('ℹ️ Super admin already exists');
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('Admin@2026', 12);
      const admin = new User({
        name: 'مدير الموقع',
        email: 'admin@hmcar.com',
        phone: '+966500000002',
        password: adminPassword,
        role: 'admin',
        permissions: getDefaultPermissions('admin'),
        status: 'active',
        isEmailVerified: true
      });
      await admin.save();
      console.log('✅ Admin created: admin@hmcar.com / Admin@2026');
    } else {
      console.log('ℹ️ Admin already exists');
    }

    // 2. Create brands
    console.log('\n🏭 Creating brands...');
    const brands = [
      { name: 'مرسيدس', country: 'ألمانيا', logo: '/images/brands/mercedes.png' },
      { name: 'بي إم دبليو', country: 'ألمانيا', logo: '/images/brands/bmw.png' },
      { name: 'أودي', country: 'ألمانيا', logo: '/images/brands/audi.png' },
      { name: 'لكزس', country: 'اليابان', logo: '/images/brands/lexus.png' },
      { name: 'تويوتا', country: 'اليابان', logo: '/images/brands/toyota.png' },
      { name: 'هيونداي', country: 'كوريا', logo: '/images/brands/hyundai.png' },
      { name: 'كيا', country: 'كوريا', logo: '/images/brands/kia.png' },
      { name: 'نيسان', country: 'اليابان', logo: '/images/brands/nissan.png' }
    ];

    for (const brandData of brands) {
      const existingBrand = await Brand.findOne({ name: brandData.name });
      if (!existingBrand) {
        await Brand.create(brandData);
        console.log(`✅ Brand created: ${brandData.name}`);
      }
    }

    // 3. Create sample cars
    console.log('\n🚗 Creating sample cars...');
    const cars = [
      {
        title: 'مرسيدس S-Class 2024',
        make: 'مرسيدس',
        model: 'S-Class',
        year: 2024,
        price: 450000,
        priceSar: 450000,
        priceUsd: 120000,
        mileage: 0,
        condition: 'excellent',
        description: 'سيارة S-Class جديدة فاخرة بالكامل',
        images: [],
        isActive: true,
        listingType: 'store'
      },
      {
        title: 'بي إم دبليو X7 2023',
        make: 'بي إم دبليو',
        model: 'X7',
        year: 2023,
        price: 380000,
        priceSar: 380000,
        priceUsd: 101333,
        mileage: 15000,
        condition: 'excellent',
        description: 'SUV فاخرة بحالة ممتازة',
        images: [],
        isActive: true,
        listingType: 'store'
      },
      {
        title: 'أودي A8 2024',
        make: 'أودي',
        model: 'A8',
        year: 2024,
        price: 320000,
        priceSar: 320000,
        priceUsd: 85333,
        mileage: 0,
        condition: 'excellent',
        description: 'سيارة تنفيذية جديدة بالكامل',
        images: [],
        isActive: true,
        listingType: 'auction'
      }
    ];

    const carCount = await Car.countDocuments();
    if (carCount === 0) {
      await Car.insertMany(cars);
      console.log(`✅ Created ${cars.length} sample cars`);
    } else {
      console.log(`ℹ️ ${carCount} cars already exist`);
    }

    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📋 Login Information:');
    console.log('🌐 Website: https://hmcar.vercel.app');
    console.log('👑 Super Admin: superadmin@hmcar.com / SuperAdmin@2026');
    console.log('🔧 Admin: admin@hmcar.com / Admin@2026');
    console.log('\n✅ Ready for production use!');

  } catch (error) {
    console.error('❌ Error in production setup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupProduction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupProduction };
