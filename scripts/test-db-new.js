
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Missing MONGO_URI (or MONGODB_URI) environment variable.');
    }

    console.log('Connecting to configured database URI...');
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!');

        // Check users
        const collection = mongoose.connection.db.collection('users');
        const admin = await collection.findOne({ role: { $in: ['admin', 'super_admin'] } });
        console.log('Admin found:', admin ? { email: admin.email, role: admin.role, username: admin.username } : 'No admin found');

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testConnection();
