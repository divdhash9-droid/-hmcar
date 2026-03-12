// [[ARABIC_HEADER]] هذا الملف (test/analytics.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;

const User = require('../models/User');
const Car = require('../models/Car');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const AnalyticsService = require('../services/AnalyticsService');

describe('AnalyticsService', function() {
  let mongo;
  before(async function() {
    try {
      mongo = await MongoMemoryServer.create();
      await mongoose.connect(mongo.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
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

  beforeEach(async function() {
    await Promise.all([User.deleteMany({}), Car.deleteMany({}), Auction.deleteMany({}), Bid.deleteMany({}), Order.deleteMany({})]);
  });

  it('should return valid summary numbers', async function() {
    await User.create({ name: 'Test User', buyerNameKey: 'test user', role: 'buyer' });
    await Car.create({ title: 'Car 1', listingType: 'auction', price: 1000 });
    const car = await Car.create({ title: 'Car 2', listingType: 'auction', price: 2000, isSold: true });
    await Auction.create({ car: car._id, startingPrice: 1000, startsAt: new Date(Date.now()-3600000), endsAt: new Date(Date.now()+3600000), status: 'running' });
    const buyer = await User.create({ name: 'Buyer', buyerNameKey: 'buyer1', role: 'buyer' });
    await Bid.create({ carId: car._id, userId: buyer._id, amount: 1500 });
    await Order.create({ orderNumber: 'TEST-1', buyer: buyer._id, status: 'confirmed', pricing: { grandTotalSar: 1500 } });

    const stats = await AnalyticsService.getSummary();
    expect(stats).to.have.property('totalUsers').that.is.a('number');
    expect(stats).to.have.property('totalCars').that.is.a('number');
    expect(stats).to.have.property('carsSold').that.is.a('number');
    expect(stats).to.have.property('totalAuctions').that.is.a('number');
    expect(stats).to.have.property('totalBids').that.is.a('number');
    expect(stats).to.have.property('avgBid').that.is.a('number');
  });
});
