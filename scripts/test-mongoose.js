// [[ARABIC_HEADER]] هذا الملف (scripts/test-mongoose.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.


const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/car-auction';

async function testQuery() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const name = "Test Client";
        const email = `client.${Date.now()}@test.com`;

        // Create user
        const user = await User.create({
            name,
            email,
            password: 'password123',
            role: 'buyer'
        });
        console.log(`User created: ${user.name} (${user._id})`);

        // Test Find by Name Exact
        const foundExact = await User.findOne({ name: name });
        console.log(`Found by Exact Name: ${!!foundExact}`);

        // Test Find by Regex
        const regex = new RegExp(`^${name}$`, 'i');
        const foundRegex = await User.findOne({ name: { $regex: regex } });
        console.log(`Found by Regex Name (${regex}): ${!!foundRegex}`);

        // Test Find by Auth Query
        const searchKey = name;
        const query = {
            $or: [
                { email: searchKey.toLowerCase() },
                { phone: searchKey },
                { name: { $regex: new RegExp(`^${searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                { buyerNameKey: searchKey }
            ]
        };
        console.log('Auth Query:', JSON.stringify(query));
        const foundAuth = await User.findOne(query);
        console.log(`Found by Auth Query: ${!!foundAuth}`);

        if (foundAuth) {
            console.log("✅ Query Logic is correct in Mongoose.");
        } else {
            console.error("❌ Mongoose query failed unexpectedly.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

testQuery();
