// [[ARABIC_HEADER]] هذا الملف (scripts/reset-database.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# MongoDB Database Reset Script
# إعادة تعيين قاعدة البيانات - حذف جميع البيانات القديمة

require('dotenv').config();
const mongoose = require('mongoose');

async function resetDatabase() {
  try {
    console.log('🗄️  Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('✅ Database is already empty');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`📊 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    // Ask for confirmation
    console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
    console.log('⚠️  This action cannot be undone!');
    console.log('');
    
    // In production, you might want to add a prompt here
    // For now, we'll add a safety check
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Cannot reset database in production mode');
      console.log('   Set NODE_ENV=development to proceed');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('🗑️  Dropping all collections...');
    
    // Drop all collections
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`   ✅ Dropped: ${collection.name}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop: ${collection.name}`);
      }
    }
    
    console.log('');
    console.log('✅ Database reset completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run seed (optional - to add sample data)');
    console.log('2. Or start fresh with: npm run dev');
    
    await mongoose.connection.close();
    console.log('');
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
