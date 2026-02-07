// [[ARABIC_HEADER]] هذا الملف (test-atlas-connection.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * test-atlas-connection.js
 * اختبار الاتصال بقاعدة بيانات MongoDB Atlas
 * 
 * الوصف:
 * - هذا الملف يختبر الاتصال بقاعدة بيانات MongoDB Atlas
 * - يتحقق من صحة معلومات الاعتماد وصلاحية سلسلة الاتصال
 */

require('dotenv').config();
const { connectDB, getConnectionStatus, connectionStates } = require('./config/database');

async function testConnection() {
  console.log('🔍 Starting MongoDB Atlas connection test...');
  
  try {
    // محاولة الاتصال بقاعدة البيانات
    console.log('🔌 Attempting to connect to MongoDB Atlas...');
    await connectDB();
    
    // التحقق من حالة الاتصال
    const status = getConnectionStatus();
    console.log(`📊 Connection Status: ${connectionStates[status]}`);
    
    if (status === 1) { // Connected
      console.log('✅ Successfully connected to MongoDB Atlas!');
      console.log('🎉 Your car auction project is now connected to the cloud database.');
      
      // عرض معلومات حول قاعدة البيانات
      const db = require('mongoose').connection.db;
      console.log(`🏷️  Database Name: ${db.databaseName}`);
      console.log(`🌐 Host: ${db.serverConfig.s.host}`);
      
      // إنهاء البرنامج بنجاح
      process.exit(0);
    } else {
      console.log('❌ Connection failed. Status:', connectionStates[status]);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('🔧 Please check:');
    console.error('   1. Your MONGO_URI in .env file');
    console.error('   2. Network connectivity');
    console.error('   3. Database user credentials');
    console.error('   4. IP address whitelist in MongoDB Atlas');
    process.exit(1);
  }
}

// تنفيذ اختبار الاتصال
testConnection();

console.log('💡 Instructions for MongoDB Atlas setup:');
console.log('   1. Create an account at mongodb.com/atlas');
console.log('   2. Create a new cluster');
console.log('   3. Create a database user with username and password');
console.log('   4. Add your IP address to the whitelist (or 0.0.0.0/0 for any IP)');
console.log('   5. Get the connection string and replace the placeholder in .env file');
console.log('   6. Replace <username>, <password>, and <cluster-name> in the MONGO_URI');
console.log('   7. Run this script again to test the connection');