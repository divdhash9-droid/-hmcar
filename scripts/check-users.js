
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');

        const users = await User.find({}, 'email phone role name');

        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            console.log('Found the following users:');
            users.forEach(user => {
                console.log(`- Role: ${user.role}, Name: ${user.name}, Email: ${user.email}, Phone: ${user.phone}`);
            });
        }
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
