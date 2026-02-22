/**
 * vercel-server.js
 * Entry point for Vercel serverless deployment
 * Connects to MongoDB Atlas and serves the Express app.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const App = require('./modules/app');

let appInstance = null;
let dbConnected = false;

async function connectDB() {
    if (dbConnected && mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI environment variable is not set');

    await mongoose.connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
    });

    dbConnected = true;
    console.log('✅ MongoDB Atlas connected');

    // Seed dev admin if needed
    if (process.env.ENABLE_DEV_ADMIN === 'true') {
        try {
            const User = require('./models/User');
            const existing = await User.findOne({ email: process.env.DEV_ADMIN_EMAIL });
            if (!existing) {
                await User.create({
                    name: process.env.DEV_ADMIN_NAME || 'Admin',
                    email: process.env.DEV_ADMIN_EMAIL,
                    password: process.env.DEV_ADMIN_PASSWORD,
                    role: 'admin',
                    isActive: true,
                });
                console.log(`👤 Dev admin created: ${process.env.DEV_ADMIN_EMAIL}`);
            }
        } catch (e) {
            console.warn('⚠️ Could not seed dev admin:', e.message);
        }
    }
}

function getApp() {
    if (!appInstance) {
        const app = new App();
        appInstance = app.app;
    }
    return appInstance;
}

// Vercel serverless handler
module.exports = async (req, res) => {
    try {
        await connectDB();
        const app = getApp();
        app(req, res);
    } catch (error) {
        console.error('❌ Server initialization error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server initialization failed',
            message: error.message
        });
    }
};
