/**
 * vercel-server.js
 * HM CAR - Vercel Serverless Entry Point
 * Connects to MongoDB Atlas and serves the Express app.
 */

const mongoose = require('mongoose');

let cachedApp = null;
let dbConnected = false;

async function connectDB() {
    if (dbConnected && mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGO_URI;
    if (!uri || uri.startsWith('memory://')) {
        throw new Error('MONGO_URI must be a valid MongoDB Atlas URI');
    }

    await mongoose.connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 8000,
        bufferCommands: false,
    });

    dbConnected = true;
    console.log('✅ MongoDB Atlas connected:', mongoose.connection.host);
}

function buildApp() {
    if (cachedApp) return cachedApp;
    const App = require('./modules/app');
    const instance = new App();
    cachedApp = instance.app;
    return cachedApp;
}

// Vercel serverless handler
module.exports = async (req, res) => {
    try {
        await connectDB();
        const app = buildApp();
        return app(req, res);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server initialization failed'
        });
    }
};
