
const mongoose = require('mongoose');

async function testConnection() {
    const uri = 'mongodb+srv://divdhash9:nakdvllltbaxwbpd@cluster0.tirfqnb.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to: ${uri}...`);
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
