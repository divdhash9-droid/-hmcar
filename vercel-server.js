/**
 * vercel-server.js
 * Vercel serverless entry point
 */

const mongoose = require('mongoose');

let cachedApp = null;
let dbConnected = false;

async function connectDB() {
    if (dbConnected && mongoose.connection.readyState === 1) return;
    const uri = process.env.MONGO_URI;
    if (!uri || uri.startsWith('memory://')) {
        throw new Error('MONGO_URI must be a valid Atlas URI');
    }
    await mongoose.connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
    });
    dbConnected = true;
}

function buildApp() {
    if (cachedApp) return cachedApp;
    try {
        const App = require('./modules/app');
        const instance = new App();
        cachedApp = instance.app;
    } catch (err) {
        console.error('[INIT ERROR]', err.message, err.stack);
        throw err;
    }
    return cachedApp;
}

module.exports = async (req, res) => {
    // Diagnostic endpoint to see real errors
    if (req.url === '/diag') {
        try {
            const app = buildApp();
            return res.status(200).json({ app: 'loaded', db: mongoose.connection.readyState });
        } catch (err) {
            return res.status(500).json({ initError: err.message, stack: err.stack });
        }
    }

    try {
        await connectDB();
        const app = buildApp();
        return app(req, res);
    } catch (error) {
        console.error('❌ Fatal:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
