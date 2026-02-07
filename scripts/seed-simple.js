// [[ARABIC_HEADER]] هذا الملف (scripts/seed-simple.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const Car = require('../models/Car');
const Brand = require('../models/Brand');

async function seedSimple() {
  try {
    console.log('🌱 Starting simple database seeding...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');
    console.log('✅ Connected to database');

    // Create brands first
    const brands = await Brand.create([
      { name: 'مرسيدس', country: 'ألمانيا' },
      { name: 'بي إم دبليو', country: 'ألمانيا' },
      { name: 'أودي', country: 'ألمانيا' },
      { name: 'لكزس', country: 'اليابان' },
      { name: 'تويوتا', country: 'اليابان' }
    ]);
    console.log(`✅ Created ${brands.length} brands`);

    // Create simple cars
    const cars = await Car.create([
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
    ]);
    console.log(`✅ Created ${cars.length} cars`);

    console.log('🎉 Simple database seeding completed successfully!');
    console.log(`📊 Summary: ${brands.length} brands, ${cars.length} cars`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedSimple()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedSimple };
