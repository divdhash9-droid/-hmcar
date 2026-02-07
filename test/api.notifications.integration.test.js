// [[ARABIC_HEADER]] هذا الملف (test/api.notifications.integration.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const appModule = require('../server');
const User = require('../models/User');

let mongo;

describe('API v2 Notifications Integration', function() {
  before(async function() {
    mongo = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongo.getUri();
  });

  after(async function() {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('GET /api/v2/notifications should require auth', async function() {
    const res = await request(appModule.app).get('/api/v2/notifications');
    if (![401,302,403].includes(res.status)) {
      throw new Error('expected auth requirement');
    }
  });
});
