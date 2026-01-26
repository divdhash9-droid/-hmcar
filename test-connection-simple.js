const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

console.log('🔍 Testing connection with:');
console.log('URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

async function testConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    console.log('📍 Host:', conn.connection.host);
    console.log('🗄️ Database:', conn.connection.name);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📋 Collections found:', collections.length);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    
    // Provide specific error analysis
    if (error.message.includes('ENOTFOUND')) {
      console.log('🔧 DNS resolution failed - check cluster name');
    } else if (error.message.includes('Authentication')) {
      console.log('🔧 Authentication failed - check username/password');
    } else if (error.message.includes('IP')) {
      console.log('🔧 IP not whitelisted - check Network Access');
    } else {
      console.log('🔧 Unknown error - check connection string');
    }
  }
}

testConnection();
