// [[ARABIC_HEADER]] هذا الملف (scripts/addDatabaseIndexes.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * سكربت لإضافة Indexes للـ Database لتحسين الأداء
 */

async function addIndexes() {
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ تم الاتصال بنجاح');

    const db = mongoose.connection.db;

    // Indexes للمستخدمين (Users)
    console.log('\n📊 إضافة Indexes للمستخدمين...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ 'permissions': 1 });
    console.log('✅ تم إضافة Indexes للمستخدمين');

    // Indexes للسيارات (Cars)
    console.log('\n📊 إضافة Indexes للسيارات...');
    await db.collection('cars').createIndex({ make: 1, model: 1 });
    await db.collection('cars').createIndex({ price: 1 });
    await db.collection('cars').createIndex({ priceSar: 1 });
    await db.collection('cars').createIndex({ priceUsd: 1 });
    await db.collection('cars').createIndex({ year: -1 });
    await db.collection('cars').createIndex({ isActive: 1, isSold: 1 });
    await db.collection('cars').createIndex({ condition: 1 });
    await db.collection('cars').createIndex({ listingType: 1 });
    await db.collection('cars').createIndex({ createdAt: -1 });
    await db.collection('cars').createIndex({ mileage: 1 });
    await db.collection('cars').createIndex({ seller: 1 });
    // Compound indexes لتحسين الاستعلامات المعقدة
    await db.collection('cars').createIndex({ isActive: 1, listingType: 1, createdAt: -1 });
    await db.collection('cars').createIndex({ make: 1, year: -1, price: 1 });
    // Text index للبحث
    await db.collection('cars').createIndex({ 
      title: 'text', 
      make: 'text', 
      model: 'text', 
      description: 'text' 
    });
    console.log('✅ تم إضافة Indexes للسيارات');

    // Indexes للمزادات (Auctions)
    console.log('\n📊 إضافة Indexes للمزادات...');
    const auctionsExists = await db.listCollections({ name: 'auctions' }).hasNext();
    if (auctionsExists) {
      await db.collection('auctions').createIndex({ car: 1 });
      await db.collection('auctions').createIndex({ status: 1 });
      await db.collection('auctions').createIndex({ startsAt: 1 });
      await db.collection('auctions').createIndex({ endsAt: 1 });
      await db.collection('auctions').createIndex({ currentPrice: -1 });
      await db.collection('auctions').createIndex({ highestBidder: 1 });
      await db.collection('auctions').createIndex({ createdAt: -1 });
      // Compound indexes للاستعلامات الشائعة
      await db.collection('auctions').createIndex({ status: 1, endsAt: 1 });
      await db.collection('auctions').createIndex({ status: 1, startsAt: 1, endsAt: 1 });
      console.log('✅ تم إضافة Indexes للمزادات');
    } else {
      console.log('⚠️  جدول المزادات غير موجود');
    }

    // Indexes للطلبات (Orders)
    console.log('\n📊 إضافة Indexes للطلبات...');
    const ordersExists = await db.listCollections({ name: 'orders' }).hasNext();
    if (ordersExists) {
      await db.collection('orders').createIndex({ user: 1 });
      await db.collection('orders').createIndex({ car: 1 });
      await db.collection('orders').createIndex({ status: 1 });
      await db.collection('orders').createIndex({ createdAt: -1 });
      await db.collection('orders').createIndex({ totalAmount: -1 });
      console.log('✅ تم إضافة Indexes للطلبات');
    } else {
      console.log('⚠️  جدول الطلبات غير موجود');
    }

    // Indexes للإعدادات (Settings)
    console.log('\n📊 إضافة Indexes للإعدادات...');
    const settingsExists = await db.listCollections({ name: 'settings' }).hasNext();
    if (settingsExists) {
      await db.collection('settings').createIndex({ key: 1 }, { unique: true });
      console.log('✅ تم إضافة Indexes للإعدادات');
    } else {
      console.log('⚠️  جدول الإعدادات غير موجود');
    }

    // عرض جميع الـ Indexes
    console.log('\n📋 قائمة الـ Indexes الحالية:');
    const collections = ['users', 'cars', 'auctions', 'orders', 'settings'];
    
    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (exists) {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`\n${collectionName}:`);
        indexes.forEach(index => {
          console.log(`  - ${JSON.stringify(index.key)}`);
        });
      }
    }

    console.log('\n✅ تم إضافة جميع الـ Indexes بنجاح!');
    console.log('🚀 الأداء سيتحسن بشكل ملحوظ في الاستعلامات');

  } catch (error) {
    console.error('❌ خطأ في إضافة الـ Indexes:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

// تشغيل السكربت
addIndexes();
