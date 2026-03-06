
const mongoose = require('mongoose');

async function testConnection() {
    const uris = [
        'mongodb+srv://admin:hmcar2024@cluster0.tirfqnb.mongodb.net/car-auction',
        'mongodb+srv://hmcar:hmcar2024@cluster0.tirfqnb.mongodb.net/car-auction',
        'mongodb+srv://divdhash9_db_user:PhLpv8iHIKx1Lki0@cluster0.tirfqnb.mongodb.net/car-auction'
    ];

    for (const uri of uris) {
        console.log(`Connecting to: ${uri}...`);
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log('✅ Connected successfully!');
            await mongoose.disconnect();
            break;
        } catch (err) {
            console.error('❌ Connection failed:', err.message);
        }
        console.log('---');
    }
}

testConnection();
