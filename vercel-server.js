/**
 * vercel-server.js
 * Vercel serverless entry point - connects to MongoDB Atlas
 */

const mongoose = require('mongoose');

// Cache app + db connection across warm invocations
let cachedApp = null;
let cachedDbPromise = null;

function connectDB() {
    if (cachedDbPromise) return cachedDbPromise;

    const uri = process.env.MONGO_URI;

    if (!uri || uri.startsWith('memory://')) {
        return Promise.reject(new Error('MONGO_URI must be a valid MongoDB Atlas URI in production'));
    }

    cachedDbPromise = mongoose.connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
    }).then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        return true;
    }).catch((err) => {
        cachedDbPromise = null; // allow retry on next request
        throw err;
    });

    return cachedDbPromise;
}

function buildApp() {
    if (cachedApp) return cachedApp;
    const App = require('./modules/app');
    const instance = new App();
    cachedApp = instance.app;
    return cachedApp;
}

// Vercel serverless function
module.exports = async (req, res) => {
    try {
        await connectDB();
        const app = buildApp();
        return app(req, res);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Server initialization failed',
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message
        });
    }
};
