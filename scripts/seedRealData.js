// [[ARABIC_HEADER]] هذا الملف (scripts/seedRealData.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * seedRealData.js
 * سكريبت لإضافة بيانات حقيقية ومنوعة (سيارات ومزادات) في قاعدة بيانات الإنتاج.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const CARS = [
    {
        title: 'Mercedes-Benz G63 AMG 2024',
        make: 'Mercedes',
        model: 'G63',
        year: 2024,
        price: 850000,
        priceSar: 850000,
        mileage: 0,
        images: ['https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&q=80&w=800'],
        description: 'The ultimate off-road luxury beast. Brand new, full options.',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'Obsidian Black',
        condition: 'excellent',
        isActive: true,
        listingType: 'store'
    },
    {
        title: 'Porsche 911 Turbo S 2023',
        make: 'Porsche',
        model: '911',
        year: 2023,
        price: 920000,
        priceSar: 920000,
        mileage: 1500,
        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'],
        description: 'The master of speed and precision. Mint condition.',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'GT Silver',
        condition: 'excellent',
        isActive: true,
        listingType: 'auction'
    },
    {
        title: 'Lexus LX 600 VIP 2024',
        make: 'Lexus',
        model: 'LX',
        year: 2024,
        price: 680000,
        priceSar: 680000,
        mileage: 500,
        images: ['https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&q=80&w=800'],
        description: 'VIP 4-seater luxury SUV. Perfect for long distances.',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'White Pearl',
        condition: 'excellent',
        isActive: true,
        listingType: 'store'
    }
];

async function run() {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.startsWith('memory://')) {
        console.error('❌ يجب توفير MONGO_URI حقيقي للرفع إلى Cloud');
        process.exit(1);
    }

    console.log('🔄 جاري الاتصال بـ MongoDB Atlas...');
    await mongoose.connect(uri);

    const Car = require('../models/Car');
    const Auction = require('../models/Auction');

    // مسح البيانات القديمة لضمان النظافة (اختياري)
    // await Car.deleteMany({});
    // await Auction.deleteMany({});

    console.log('🌱 جاري إضافة السيارات...');
    const createdCars = await Car.create(CARS);
    console.log(`✅ تم إضافة ${createdCars.length} سيارة.`);

    // إضافة مزاد لإحدى السيارات
    const porsche = createdCars.find(c => c.model === '911');
    if (porsche) {
        const auction = new Auction({
            carId: porsche._id,
            startPrice: 850000,
            currentPrice: 850000,
            minIncrement: 5000,
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // بعد أسبوع
            status: 'active',
            title: 'Porsche 911 Turbo S Premium Auction'
        });
        await auction.save();
        console.log('✅ تم إضافة مزاد نشط للبورشة.');
    }

    await mongoose.disconnect();
    console.log('🏁 انتهت عملية إضافة البيانات الحقيقية.');
}

run().catch(console.error);
