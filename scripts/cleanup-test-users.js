// [[ARABIC_HEADER]] هذا الملف (scripts/cleanup-test-users.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.


const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/car-auction';

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const name = "Test Client";
        const result = await User.deleteMany({ name: name });
        console.log(`Deleted ${result.deletedCount} users with name '${name}'`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

cleanup();
