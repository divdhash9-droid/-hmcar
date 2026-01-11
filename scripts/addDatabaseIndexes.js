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
    await db.collection('cars').createIndex({ year: -1 });
    await db.collection('cars').createIndex({ status: 1 });
    await db.collection('cars').createIndex({ createdAt: -1 });
    await db.collection('cars').createIndex({ mileage: 1 });
    await db.collection('cars').createIndex({ transmission: 1 });
    await db.collection('cars').createIndex({ fuelType: 1 });
    await db.collection('cars').createIndex({ 'location.city': 1 });
    // Text index للبحث
    await db.collection('cars').createIndex({ 
      name: 'text', 
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
      await db.collection('auctions').createIndex({ startDate: 1 });
      await db.collection('auctions').createIndex({ endDate: 1 });
      await db.collection('auctions').createIndex({ currentBid: -1 });
      await db.collection('auctions').createIndex({ createdAt: -1 });
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
