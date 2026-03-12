
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
    const uris = [
        process.env.MONGO_URI,
        process.env.MONGODB_URI,
        ...(process.env.MONGO_URI_CANDIDATES
            ? process.env.MONGO_URI_CANDIDATES.split(',').map((v) => v.trim())
            : [])
    ].filter(Boolean);

    if (!uris.length) {
        throw new Error('Missing MONGO_URI/MONGODB_URI. Optionally set MONGO_URI_CANDIDATES as comma-separated URIs.');
    }

    for (const uri of uris) {
        console.log('Connecting to configured database URI...');
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
