// [[ARABIC_HEADER]] هذا الملف (test/models/auction.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Auction = require('../../models/Auction');
const Car = require('../../models/Car');
const User = require('../../models/User');

describe('Auction Model Tests', () => {
  let mongoServer;

  before(async function() {
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    } catch (error) {
      console.warn('Skipping suite: MongoMemoryServer unavailable on this machine.', error.message);
      this.skip();
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    await Auction.deleteMany({});
    await Car.deleteMany({});
    await User.deleteMany({});
  });

  describe('Auction Creation', () => {
    let car;

    beforeEach(async () => {
      car = await Car.create({
        title: 'BMW X5 2021',
        make: 'BMW',
        model: 'X5',
        year: 2021,
        listingType: 'auction'
      });
    });

    it('should create a valid auction with required fields', async () => {
      const startsAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const endsAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now

      const auctionData = {
        car: car._id,
        startingPrice: 100000,
        startsAt: startsAt,
        endsAt: endsAt
      };

      const auction = await Auction.create(auctionData);
      
      expect(auction).to.have.property('_id');
      expect(auction.car.toString()).to.equal(car._id.toString());
      expect(auction.startingPrice).to.equal(100000);
      expect(auction.currentPrice).to.equal(0);
      expect(auction.currency).to.equal('SAR');
      expect(auction.status).to.equal('scheduled');
    });

    it('should fail without required car field', async () => {
      const auctionData = {
        startingPrice: 50000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      };

      try {
        await Auction.create(auctionData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.car).to.exist;
      }
    });

    it('should fail without required startingPrice', async () => {
      const auctionData = {
        car: car._id,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      };

      try {
        await Auction.create(auctionData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.startingPrice).to.exist;
      }
    });

    it('should fail without required time fields', async () => {
      try {
        await Auction.create({
          car: car._id,
          startingPrice: 75000
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.startsAt).to.exist;
        expect(error.errors.endsAt).to.exist;
      }
    });
  });

  describe('Auction Currency', () => {
    let car;

    beforeEach(async () => {
      car = await Car.create({
        title: 'Test Car for Currency',
        listingType: 'auction'
      });
    });

    it('should accept SAR currency', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 100000,
        currency: 'SAR',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      expect(auction.currency).to.equal('SAR');
    });

    it('should accept USD currency', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 25000,
        currency: 'USD',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      expect(auction.currency).to.equal('USD');
    });

    it('should default to SAR currency', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 80000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      expect(auction.currency).to.equal('SAR');
    });

    it('should reject invalid currency', async () => {
      try {
        await Auction.create({
          car: car._id,
          startingPrice: 50000,
          currency: 'EUR',
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Auction Status', () => {
    let car;

    beforeEach(async () => {
      car = await Car.create({
        title: 'Status Test Car',
        listingType: 'auction'
      });
    });

    const statuses = ['scheduled', 'running', 'ended'];

    statuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const auction = await Auction.create({
          car: car._id,
          startingPrice: 60000,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          status: status
        });

        expect(auction.status).to.equal(status);
      });
    });

    it('should default to scheduled status', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 70000,
        startsAt: new Date(Date.now() + 1000 * 60 * 60),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      expect(auction.status).to.equal('scheduled');
    });

    it('should reject invalid status', async () => {
      try {
        await Auction.create({
          car: car._id,
          startingPrice: 50000,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          status: 'invalid_status'
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Auction Bidding', () => {
    let car, bidder;

    beforeEach(async () => {
      car = await Car.create({
        title: 'Bidding Test Car',
        listingType: 'auction'
      });

      bidder = await User.create({
        name: 'Test Bidder',
        buyerNameKey: '500000003',
        password: 'Bidder@123'
      });
    });

    it('should initialize with zero current price', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 50000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      expect(auction.currentPrice).to.equal(0);
      expect(auction.highestBidder).to.be.null;
    });

    it('should update current price and highest bidder', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 50000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      auction.currentPrice = 55000;
      auction.highestBidder = bidder._id;
      await auction.save();

      const updatedAuction = await Auction.findById(auction._id).populate('highestBidder');
      expect(updatedAuction.currentPrice).to.equal(55000);
      expect(updatedAuction.highestBidder._id.toString()).to.equal(bidder._id.toString());
    });

    it('should handle multiple bid updates', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 50000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      // First bid
      auction.currentPrice = 52000;
      auction.highestBidder = bidder._id;
      await auction.save();

      expect(auction.currentPrice).to.equal(52000);

      // Second bid
      auction.currentPrice = 57000;
      await auction.save();

      expect(auction.currentPrice).to.equal(57000);
    });
  });

  describe('Auction isActive Method', () => {
    let car;

    beforeEach(async () => {
      car = await Car.create({
        title: 'Active Test Car',
        listingType: 'auction'
      });
    });

    it('should return true for running auction within time window', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 60000,
        startsAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
        status: 'running'
      });

      expect(auction.isActive()).to.be.true;
    });

    it('should return false for auction not yet started', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 60000,
        startsAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'scheduled'
      });

      expect(auction.isActive()).to.be.false;
    });

    it('should return false for auction already ended by time', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 60000,
        startsAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        status: 'running'
      });

      expect(auction.isActive()).to.be.false;
    });

    it('should return false for ended auction', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 60000,
        startsAt: new Date(Date.now() - 1000 * 60 * 60),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'ended'
      });

      expect(auction.isActive()).to.be.false;
    });
  });

  describe('Auction Population', () => {
    let car, seller, bidder;

    beforeEach(async () => {
      seller = await User.create({
        name: 'Auction Seller',
        phone: '1112223333',
        role: 'seller',
        password: 'Seller@123'
      });

      bidder = await User.create({
        name: 'Auction Bidder',
        buyerNameKey: '500000004',
        password: 'Bidder@123'
      });

      car = await Car.create({
        title: 'Mercedes S-Class 2022',
        make: 'Mercedes',
        model: 'S-Class',
        year: 2022,
        seller: seller._id,
        listingType: 'auction'
      });
    });

    it('should populate car details', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 200000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      const populatedAuction = await Auction.findById(auction._id).populate('car');
      
      expect(populatedAuction.car).to.be.an('object');
      expect(populatedAuction.car.title).to.equal('Mercedes S-Class 2022');
      expect(populatedAuction.car.make).to.equal('Mercedes');
    });

    it('should populate highest bidder', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 200000,
        currentPrice: 210000,
        highestBidder: bidder._id,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      const populatedAuction = await Auction.findById(auction._id)
        .populate('highestBidder');
      
      expect(populatedAuction.highestBidder).to.be.an('object');
      expect(populatedAuction.highestBidder.name).to.equal('Auction Bidder');
    });

    it('should populate both car and bidder', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 200000,
        currentPrice: 220000,
        highestBidder: bidder._id,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      const populatedAuction = await Auction.findById(auction._id)
        .populate('car')
        .populate('highestBidder');
      
      expect(populatedAuction.car.title).to.equal('Mercedes S-Class 2022');
      expect(populatedAuction.highestBidder.name).to.equal('Auction Bidder');
    });
  });

  describe('Auction Timestamps', () => {
    let car;

    beforeEach(async () => {
      car = await Car.create({
        title: 'Timestamp Test Car',
        listingType: 'auction'
      });
    });

    it('should have createdAt and updatedAt timestamps', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 80000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      expect(auction.createdAt).to.be.instanceOf(Date);
      expect(auction.updatedAt).to.be.instanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const auction = await Auction.create({
        car: car._id,
        startingPrice: 80000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      const originalUpdatedAt = auction.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 100));

      auction.currentPrice = 85000;
      await auction.save();

      expect(auction.updatedAt.getTime()).to.be.greaterThan(originalUpdatedAt.getTime());
    });
  });
});
