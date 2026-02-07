// [[ARABIC_HEADER]] هذا الملف (scripts/optimizeDatabaseIndexes.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * scripts/optimizeDatabaseIndexes.js
 * سكربت متقدم لتحسين فهارس قاعدة البيانات وتحليل الأداء
 * 
 * الميزات:
 * - إنشاء فهارس محسنة لجميع الجداول
 * - فهارس مركبة للاستعلامات المعقدة
 * - تحليل أداء الاستعلامات
 * - تقرير شامل عن حالة الفهارس
 */

const mongoose = require('mongoose');
require('dotenv').config();

const INDEXES_CONFIG = {
  // فهارس المستخدمين
  users: [
    { key: { email: 1 }, options: { unique: true, sparse: true, name: 'idx_email_unique' } },
    { key: { phone: 1 }, options: { unique: true, sparse: true, name: 'idx_phone_unique' } },
    { key: { buyerNameKey: 1 }, options: { unique: true, sparse: true, name: 'idx_buyerNameKey_unique' } },
    { key: { role: 1, status: 1 }, options: { name: 'idx_role_status' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } },
    { key: { lastLoginAt: -1 }, options: { name: 'idx_lastLogin_desc' } },
    { key: { role: 1, createdAt: -1 }, options: { name: 'idx_role_createdAt' } },
    { key: { status: 1, role: 1 }, options: { name: 'idx_status_role' } },
    { key: { 'permissions': 1 }, options: { name: 'idx_permissions' } }
  ],

  // فهارس السيارات
  cars: [
    { key: { listingType: 1, isSold: 1 }, options: { name: 'idx_listingType_isSold' } },
    { key: { make: 1, model: 1, year: -1 }, options: { name: 'idx_make_model_year' } },
    { key: { price: 1 }, options: { name: 'idx_price' } },
    { key: { priceSar: 1 }, options: { name: 'idx_priceSar' } },
    { key: { priceUsd: 1 }, options: { name: 'idx_priceUsd' } },
    { key: { year: -1 }, options: { name: 'idx_year_desc' } },
    { key: { mileage: 1 }, options: { name: 'idx_mileage' } },
    { key: { condition: 1 }, options: { name: 'idx_condition' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } },
    { key: { category: 1, isSold: 1 }, options: { name: 'idx_category_isSold' } },
    { key: { seller: 1, createdAt: -1 }, options: { name: 'idx_seller_createdAt' } },
    { key: { isSold: 1, createdAt: -1 }, options: { name: 'idx_isSold_createdAt' } },
    { 
      key: { title: 'text', make: 'text', model: 'text', description: 'text' }, 
      options: { 
        name: 'idx_text_search',
        weights: { title: 10, make: 5, model: 5, description: 1 },
        default_language: 'arabic'
      } 
    }
  ],

  // فهارس المزادات
  auctions: [
    { key: { car: 1 }, options: { name: 'idx_car' } },
    { key: { status: 1 }, options: { name: 'idx_status' } },
    { key: { startsAt: 1 }, options: { name: 'idx_startsAt' } },
    { key: { endsAt: 1 }, options: { name: 'idx_endsAt' } },
    { key: { status: 1, startsAt: 1, endsAt: 1 }, options: { name: 'idx_status_dates' } },
    { key: { currentPrice: -1 }, options: { name: 'idx_currentPrice_desc' } },
    { key: { highestBidder: 1 }, options: { name: 'idx_highestBidder' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } },
    { key: { status: 1, createdAt: -1 }, options: { name: 'idx_status_createdAt' } }
  ],

  // فهارس المزايدات
  bids: [
    { key: { carId: 1 }, options: { name: 'idx_carId' } },
    { key: { userId: 1 }, options: { name: 'idx_userId' } },
    { key: { carId: 1, amount: -1 }, options: { name: 'idx_carId_amount' } },
    { key: { carId: 1, createdAt: -1 }, options: { name: 'idx_carId_createdAt' } },
    { key: { userId: 1, createdAt: -1 }, options: { name: 'idx_userId_createdAt' } },
    { key: { amount: -1, createdAt: -1 }, options: { name: 'idx_amount_createdAt' } }
  ],

  // فهارس الطلبات
  orders: [
    { key: { user: 1 }, options: { name: 'idx_user' } },
    { key: { car: 1 }, options: { name: 'idx_car' } },
    { key: { status: 1 }, options: { name: 'idx_status' } },
    { key: { orderNumber: 1 }, options: { unique: true, sparse: true, name: 'idx_orderNumber_unique' } },
    { key: { user: 1, status: 1 }, options: { name: 'idx_user_status' } },
    { key: { user: 1, createdAt: -1 }, options: { name: 'idx_user_createdAt' } },
    { key: { status: 1, createdAt: -1 }, options: { name: 'idx_status_createdAt' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } },
    { key: { totalAmount: -1 }, options: { name: 'idx_totalAmount_desc' } }
  ],

  // فهارس الإشعارات
  usernotifications: [
    { key: { user: 1 }, options: { name: 'idx_user' } },
    { key: { user: 1, isRead: 1 }, options: { name: 'idx_user_isRead' } },
    { key: { user: 1, createdAt: -1 }, options: { name: 'idx_user_createdAt' } },
    { key: { type: 1 }, options: { name: 'idx_type' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } },
    { key: { createdAt: 1 }, options: { expireAfterSeconds: 2592000, name: 'idx_ttl_30days' } } // حذف بعد 30 يوم
  ],

  // فهارس المفضلة
  favorites: [
    { key: { user: 1, car: 1 }, options: { unique: true, name: 'idx_user_car_unique' } },
    { key: { user: 1, createdAt: -1 }, options: { name: 'idx_user_createdAt' } },
    { key: { car: 1 }, options: { name: 'idx_car' } }
  ],

  // فهارس التقييمات
  reviews: [
    { key: { car: 1 }, options: { name: 'idx_car' } },
    { key: { user: 1 }, options: { name: 'idx_user' } },
    { key: { car: 1, user: 1 }, options: { unique: true, name: 'idx_car_user_unique' } },
    { key: { rating: -1 }, options: { name: 'idx_rating_desc' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } }
  ],

  // فهارس سجل التدقيق
  auditlogs: [
    { key: { user: 1 }, options: { name: 'idx_user' } },
    { key: { action: 1 }, options: { name: 'idx_action' } },
    { key: { targetModel: 1, targetId: 1 }, options: { name: 'idx_target' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } },
    { key: { user: 1, action: 1, createdAt: -1 }, options: { name: 'idx_user_action_date' } },
    { key: { createdAt: 1 }, options: { expireAfterSeconds: 7776000, name: 'idx_ttl_90days' } } // حذف بعد 90 يوم
  ],

  // فهارس التحليلات
  analytics: [
    { key: { type: 1 }, options: { name: 'idx_type' } },
    { key: { date: -1 }, options: { name: 'idx_date_desc' } },
    { key: { type: 1, date: -1 }, options: { name: 'idx_type_date' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } }
  ],

  // فهارس الإعدادات
  sitesettings: [
    { key: { key: 1 }, options: { unique: true, name: 'idx_key_unique' } }
  ],

  // فهارس الماركات
  brands: [
    { key: { name: 1 }, options: { unique: true, name: 'idx_name_unique' } },
    { key: { isActive: 1 }, options: { name: 'idx_isActive' } }
  ],

  // فهارس الرسائل
  messages: [
    { key: { conversation: 1 }, options: { name: 'idx_conversation' } },
    { key: { sender: 1 }, options: { name: 'idx_sender' } },
    { key: { conversation: 1, createdAt: -1 }, options: { name: 'idx_conversation_createdAt' } },
    { key: { createdAt: -1 }, options: { name: 'idx_createdAt_desc' } }
  ],

  // فهارس المحادثات
  conversations: [
    { key: { participants: 1 }, options: { name: 'idx_participants' } },
    { key: { updatedAt: -1 }, options: { name: 'idx_updatedAt_desc' } }
  ],

  // فهارس سجل البحث
  searchhistories: [
    { key: { user: 1 }, options: { name: 'idx_user' } },
    { key: { query: 1 }, options: { name: 'idx_query' } },
    { key: { user: 1, createdAt: -1 }, options: { name: 'idx_user_createdAt' } },
    { key: { createdAt: 1 }, options: { expireAfterSeconds: 604800, name: 'idx_ttl_7days' } } // حذف بعد 7 أيام
  ]
};

class DatabaseOptimizer {
  constructor() {
    this.stats = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
  }

  async connect() {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ تم الاتصال بنجاح\n');
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('\n🔌 تم قطع الاتصال');
  }

  async createIndexes() {
    const db = mongoose.connection.db;

    for (const [collectionName, indexes] of Object.entries(INDEXES_CONFIG)) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      
      if (!exists) {
        console.log(`⚠️  جدول ${collectionName} غير موجود - تخطي`);
        continue;
      }

      console.log(`\n📊 معالجة فهارس ${collectionName}...`);
      const collection = db.collection(collectionName);

      for (const { key, options } of indexes) {
        try {
          await collection.createIndex(key, options);
          console.log(`   ✅ ${options.name}`);
          this.stats.created++;
        } catch (error) {
          if (error.code === 85 || error.code === 86) {
            // الفهرس موجود مسبقاً
            console.log(`   ⏭️  ${options.name} (موجود)`);
            this.stats.skipped++;
          } else {
            console.log(`   ❌ ${options.name}: ${error.message}`);
            this.stats.failed++;
            this.stats.errors.push({ collection: collectionName, index: options.name, error: error.message });
          }
        }
      }
    }
  }

  async analyzeIndexUsage() {
    console.log('\n📈 تحليل استخدام الفهارس...\n');
    const db = mongoose.connection.db;

    for (const collectionName of Object.keys(INDEXES_CONFIG)) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (!exists) continue;

      try {
        const stats = await db.collection(collectionName).aggregate([
          { $indexStats: {} }
        ]).toArray();

        if (stats.length > 0) {
          console.log(`\n${collectionName}:`);
          stats.forEach(stat => {
            const usage = stat.accesses?.ops || 0;
            const status = usage > 0 ? '🟢' : '🔴';
            console.log(`   ${status} ${stat.name}: ${usage} استخدام`);
          });
        }
      } catch (error) {
        // تخطي إذا لم تكن لدينا صلاحيات
      }
    }
  }

  async getCollectionStats() {
    console.log('\n📊 إحصائيات الجداول:\n');
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    
    for (const col of collections) {
      try {
        const stats = await db.collection(col.name).stats();
        const sizeKB = (stats.size / 1024).toFixed(2);
        const indexSizeKB = (stats.totalIndexSize / 1024).toFixed(2);
        console.log(`${col.name}:`);
        console.log(`   📄 عدد المستندات: ${stats.count}`);
        console.log(`   💾 حجم البيانات: ${sizeKB} KB`);
        console.log(`   📑 حجم الفهارس: ${indexSizeKB} KB`);
        console.log(`   📊 عدد الفهارس: ${stats.nindexes}`);
      } catch (error) {
        // تخطي
      }
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 ملخص العملية:');
    console.log('='.repeat(50));
    console.log(`   ✅ فهارس تم إنشاؤها: ${this.stats.created}`);
    console.log(`   ⏭️  فهارس موجودة: ${this.stats.skipped}`);
    console.log(`   ❌ فهارس فاشلة: ${this.stats.failed}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  الأخطاء:');
      this.stats.errors.forEach(err => {
        console.log(`   - ${err.collection}.${err.index}: ${err.error}`);
      });
    }
    console.log('='.repeat(50));
  }
}

async function main() {
  const optimizer = new DatabaseOptimizer();
  
  try {
    await optimizer.connect();
    await optimizer.createIndexes();
    await optimizer.getCollectionStats();
    // await optimizer.analyzeIndexUsage(); // يتطلب صلاحيات خاصة
    optimizer.printSummary();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await optimizer.disconnect();
  }
}

// تشغيل السكربت
if (require.main === module) {
  main();
}

module.exports = { DatabaseOptimizer, INDEXES_CONFIG };
