/**
 * vercel-server.js
 * Entry point for Vercel deployment
 * This file wraps the main app module for Vercel's serverless environment.
 */

const App = require('./modules/app');

let appInstance = null;

async function getApp() {
    if (!appInstance) {
        const app = new App();
        // For Vercel, we don't call app.start() (which listens on a port)
        // Instead we just set up the express instance
        appInstance = app.app;
    }
    return appInstance;
}

// For Vercel serverless function
module.exports = async (req, res) => {
    const app = await getApp();
    app(req, res);
};
