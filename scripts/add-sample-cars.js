// [[ARABIC_HEADER]] هذا الملف (scripts/add-sample-cars.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const Car = require('../models/Car');

async function addSampleCars() {
  try {
    console.log('🚗 Adding sample cars...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');
    console.log('✅ Connected to database');

    // Check existing cars
    const existingCount = await Car.countDocuments();
    console.log(`📊 Found ${existingCount} existing cars`);

    if (existingCount > 0) {
      console.log('ℹ️ Cars already exist, skipping...');
      return;
    }

    // Create sample cars
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
      },
      {
        title: 'لكزس LX 570 2023',
        make: 'لكزس',
        model: 'LX 570',
        year: 2023,
        price: 410000,
        priceSar: 410000,
        priceUsd: 109333,
        mileage: 8000,
        condition: 'excellent',
        description: 'SUV يابانية فاخرة',
        images: [],
        isActive: true,
        listingType: 'store'
      }
    ]);
    
    console.log(`✅ Added ${cars.length} sample cars`);
    console.log('🎉 Sample cars added successfully!');

  } catch (error) {
    console.error('❌ Error adding sample cars:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addSampleCars()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { addSampleCars };
