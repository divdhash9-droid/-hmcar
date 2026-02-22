/**
 * vercel-server.js - Minimal diagnostic version
 */

module.exports = async (req, res) => {
    // Step 1: Basic ping
    if (req.url === '/ping') {
        return res.status(200).json({ ok: true, env: process.env.NODE_ENV, time: new Date().toISOString() });
    }

    // Step 2: Test mongoose
    if (req.url === '/test-mongoose') {
        try {
            const mongoose = require('mongoose');
            return res.status(200).json({ mongoose: 'ok', version: mongoose.version });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Step 3: Test DB connect (short timeout)
    if (req.url === '/test-db') {
        try {
            const mongoose = require('mongoose');
            const uri = process.env.MONGO_URI;
            if (!uri) return res.status(500).json({ error: 'MONGO_URI not set' });

            const preview = uri.substring(0, 50) + '...';

            if (mongoose.connection.readyState === 1) {
                return res.status(200).json({ db: 'already connected', host: mongoose.connection.host });
            }

            await mongoose.connect(uri, {
                maxPoolSize: 3,
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
                socketTimeoutMS: 8000,
                bufferCommands: false,
            });

            return res.status(200).json({
                success: true,
                db: 'connected',
                host: mongoose.connection.host,
                name: mongoose.connection.name
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: e.message,
                code: e.code,
                uri_preview: (process.env.MONGO_URI || '').substring(0, 55) + '...'
            });
        }
    }

    // Step 4: Test app load
    if (req.url === '/test-app') {
        try {
            const App = require('./modules/app');
            const instance = new App();
            return res.status(200).json({ app: 'loaded' });
        } catch (e) {
            return res.status(500).json({ error: e.message, stack: (e.stack || '').substring(0, 800) });
        }
    }

    // Default
    return res.status(200).json({
        status: 'diagnostic mode',
        endpoints: ['/ping', '/test-mongoose', '/test-db', '/test-app']
    });
};
