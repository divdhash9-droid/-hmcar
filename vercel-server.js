/**
 * vercel-server.js - Minimal diagnostic version
 */

module.exports = async (req, res) => {
    // Step 1: Basic response (no requires)
    if (req.url === '/ping') {
        return res.status(200).json({ ok: true, env: process.env.NODE_ENV });
    }

    // Step 2: Test mongoose require
    if (req.url === '/test-mongoose') {
        try {
            const mongoose = require('mongoose');
            return res.status(200).json({ mongoose: 'ok', version: mongoose.version });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Step 3: Test DB connect
    if (req.url === '/test-db') {
        try {
            const mongoose = require('mongoose');
            const uri = process.env.MONGO_URI;
            if (!uri) return res.status(500).json({ error: 'MONGO_URI not set' });
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, bufferCommands: false });
            }
            return res.status(200).json({ db: 'connected', host: mongoose.connection.host });
        } catch (e) {
            return res.status(500).json({ error: e.message, uri_preview: (process.env.MONGO_URI || '').substring(0, 50) });
        }
    }

    // Step 4: Test app load
    if (req.url === '/test-app') {
        try {
            const App = require('./modules/app');
            const instance = new App();
            return res.status(200).json({ app: 'loaded' });
        } catch (e) {
            return res.status(500).json({ error: e.message, stack: e.stack ? e.stack.substring(0, 500) : null });
        }
    }

    // Default
    return res.status(200).json({
        status: 'diagnostic mode',
        endpoints: ['/ping', '/test-mongoose', '/test-db', '/test-app']
    });
};
