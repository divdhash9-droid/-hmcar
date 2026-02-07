// [[ARABIC_HEADER]] هذا الملف (scripts/seed-database.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Auction = require('../models/Auction');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');
    console.log('✅ Connected to database');

    // Clear existing data
    await Car.deleteMany({});
    await Brand.deleteMany({});
    await Auction.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create brands
    const brands = await Brand.create([
      { name: 'مرسيدس', country: 'ألمانيا', logo: '/images/brands/mercedes.png' },
      { name: 'بي إم دبليو', country: 'ألمانيا', logo: '/images/brands/bmw.png' },
      { name: 'أودي', country: 'ألمانيا', logo: '/images/brands/audi.png' },
      { name: 'لكزس', country: 'اليابان', logo: '/images/brands/lexus.png' },
      { name: 'تويوتا', country: 'اليابان', logo: '/images/brands/toyota.png' }
    ]);
    console.log(`✅ Created ${brands.length} brands`);

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
        images: ['/uploads/cars/mercedes-sclass-1.jpg', '/uploads/cars/mercedes-sclass-2.jpg'],
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
        images: ['/uploads/cars/bmw-x7-1.jpg', '/uploads/cars/bmw-x7-2.jpg'],
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
        images: ['/uploads/cars/audi-a8-1.jpg', '/uploads/cars/audi-a8-2.jpg'],
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
        images: ['/uploads/cars/lexus-lx-1.jpg', '/uploads/cars/lexus-lx-2.jpg'],
        isActive: true,
        listingType: 'store'
      },
      {
        title: 'تويوتا لاند كروزر 2024',
        make: 'تويوتا',
        model: 'لاند كروزر',
        year: 2024,
        price: 280000,
        priceSar: 280000,
        priceUsd: 74667,
        mileage: 0,
        condition: 'excellent',
        description: 'سيارة رياضية متعددة الأغراض جديدة',
        images: ['/uploads/cars/landcruiser-1.jpg', '/uploads/cars/landcruiser-2.jpg'],
        isActive: true,
        listingType: 'store'
      }
    ]);
    console.log(`✅ Created ${cars.length} cars`);

    // Create sample auctions
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const auctions = await Auction.create([
      {
        car: cars[2]._id, // أودي A8
        seller: null, // Will be set later
        startingPrice: 250000,
        currentPrice: 250000,
        reservePrice: 280000,
        startTime: now,
        endsAt: tomorrow,
        status: 'running',
        currency: 'SAR',
        minBidIncrement: 5000,
        description: 'مزاد لسيارة أودي A8 جديدة بالكامل'
      },
      {
        car: cars[0]._id, // مرسيدس S-Class
        seller: null,
        startingPrice: 400000,
        currentPrice: 400000,
        reservePrice: 450000,
        startTime: now,
        endsAt: nextWeek,
        status: 'scheduled',
        currency: 'SAR',
        minBidIncrement: 10000,
        description: 'مزاد لسيارة مرسيدس S-Class فاخرة'
      }
    ]);
    console.log(`✅ Created ${auctions.length} auctions`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary: ${brands.length} brands, ${cars.length} cars, ${auctions.length} auctions`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
