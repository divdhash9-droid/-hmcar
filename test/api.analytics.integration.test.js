// [[ARABIC_HEADER]] هذا الملف (test/api.analytics.integration.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const App = require('../modules/app');

let mongo;
let app;

describe('API v2 Analytics Integration', function() {
  before(async function() {
    try {
      mongo = await MongoMemoryServer.create();
      process.env.MONGO_URI = mongo.getUri();
      app = new App().app;
    } catch (error) {
      console.warn('Skipping suite: MongoMemoryServer unavailable on this machine.', error.message);
      this.skip();
    }
  });

  after(async function() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongo) {
      await mongo.stop();
    }
  });

  it('GET /api/v2/analytics should require auth and return 401 when not logged in', async function() {
    const res = await request(app).get('/api/v2/analytics');
    // expecting redirect or 401 depending on auth middleware
    if (res.status === 302) {
      // redirected to login
      return;
    }
    // otherwise expect 401 or 403
    if (![401,403].includes(res.status)) {
      throw new Error('expected unauthenticated response');
    }
  });
});
