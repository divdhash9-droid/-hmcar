// [[ARABIC_HEADER]] هذا الملف (test/models/car.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Car = require('../../models/Car');
const User = require('../../models/User');

describe('Car Model Tests', () => {
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
    await Car.deleteMany({});
    await User.deleteMany({});
  });

  describe('Car Creation', () => {
    it('should create a valid car with required fields', async () => {
      const carData = {
        title: 'Toyota Corolla 2020',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        price: 50000,
        listingType: 'store'
      };

      const car = await Car.create(carData);
      
      expect(car).to.have.property('_id');
      expect(car.title).to.equal('Toyota Corolla 2020');
      expect(car.make).to.equal('Toyota');
      expect(car.listingType).to.equal('store');
      expect(car.isActive).to.be.true;
      expect(car.isSold).to.be.false;
    });

    it('should fail without required title', async () => {
      const carData = {
        make: 'Honda',
        model: 'Civic',
        year: 2019
      };

      try {
        await Car.create(carData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.title).to.exist;
      }
    });

    it('should set default values correctly', async () => {
      const car = await Car.create({
        title: 'BMW X5 2021'
      });

      expect(car.listingType).to.equal('store');
      expect(car.isActive).to.be.true;
      expect(car.isSold).to.be.false;
      expect(car.externalUrl).to.equal('');
    });
  });

  describe('Car Listing Types', () => {
    it('should accept store listing type', async () => {
      const car = await Car.create({
        title: 'Mercedes E-Class',
        listingType: 'store'
      });

      expect(car.listingType).to.equal('store');
    });

    it('should accept auction listing type', async () => {
      const car = await Car.create({
        title: 'Audi A6',
        listingType: 'auction',
        externalUrl: 'https://auction.example.com/car123'
      });

      expect(car.listingType).to.equal('auction');
      expect(car.externalUrl).to.equal('https://auction.example.com/car123');
    });

    it('should reject invalid listing type', async () => {
      try {
        await Car.create({
          title: 'Invalid Car',
          listingType: 'invalid_type'
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Car Conditions', () => {
    const conditions = ['excellent', 'good', 'fair', 'needs work'];

    conditions.forEach(condition => {
      it(`should accept ${condition} condition`, async () => {
        const car = await Car.create({
          title: `Test Car - ${condition}`,
          condition: condition
        });

        expect(car.condition).to.equal(condition);
      });
    });

    it('should default to good condition', async () => {
      const car = await Car.create({
        title: 'Default Condition Car'
      });

      expect(car.condition).to.equal('good');
    });
  });

  describe('Car Sale Management', () => {
    let seller, buyer;

    beforeEach(async () => {
      seller = await User.create({
        name: 'Seller User',
        phone: '1234567890',
        role: 'seller',
        password: 'Test@123'
      });

      buyer = await User.create({
        name: 'Buyer User',
        buyerNameKey: '500000001',
        role: 'buyer',
        password: 'Buyer@123'
      });
    });

    it('should mark car as sold with buyer info', async () => {
      const car = await Car.create({
        title: 'Car for Sale',
        seller: seller._id,
        price: 75000
      });

      car.isSold = true;
      car.soldTo = buyer._id;
      car.soldAt = new Date();
      await car.save();

      const soldCar = await Car.findById(car._id).populate('soldTo');
      expect(soldCar.isSold).to.be.true;
      expect(soldCar.soldTo._id.toString()).to.equal(buyer._id.toString());
      expect(soldCar.soldAt).to.be.instanceOf(Date);
    });

    it('should handle pending sale', async () => {
      const car = await Car.create({
        title: 'Pending Sale Car',
        price: 60000
      });

      const saleToken = 'pending_token_123';
      car.pendingSaleToken = saleToken;
      car.pendingSaleBuyer = buyer._id;
      car.pendingSaleAt = new Date();
      await car.save();

      const pendingCar = await Car.findById(car._id);
      expect(pendingCar.pendingSaleToken).to.equal(saleToken);
      expect(pendingCar.pendingSaleBuyer.toString()).to.equal(buyer._id.toString());
    });
  });

  describe('Car Pricing', () => {
    it('should handle multiple currency prices', async () => {
      const car = await Car.create({
        title: 'Multi-Currency Car',
        price: 50000,
        priceSar: 187500,
        priceUsd: 50000
      });

      expect(car.price).to.equal(50000);
      expect(car.priceSar).to.equal(187500);
      expect(car.priceUsd).to.equal(50000);
    });

    it('should accept zero price', async () => {
      const car = await Car.create({
        title: 'Free Car',
        price: 0
      });

      expect(car.price).to.equal(0);
    });
  });

  describe('Car Images', () => {
    it('should store multiple images', async () => {
      const images = [
        '/uploads/car1-front.jpg',
        '/uploads/car1-side.jpg',
        '/uploads/car1-interior.jpg'
      ];

      const car = await Car.create({
        title: 'Car with Images',
        images: images
      });

      expect(car.images).to.be.an('array');
      expect(car.images).to.have.lengthOf(3);
      expect(car.images).to.deep.equal(images);
    });

    it('should handle empty images array', async () => {
      const car = await Car.create({
        title: 'Car without Images'
      });

      expect(car.images).to.be.an('array');
      expect(car.images).to.have.lengthOf(0);
    });
  });

  describe('Car Activity Status', () => {
    it('should activate car', async () => {
      const car = await Car.create({
        title: 'Inactive Car',
        isActive: false
      });

      expect(car.isActive).to.be.false;

      car.isActive = true;
      await car.save();

      const activeCar = await Car.findById(car._id);
      expect(activeCar.isActive).to.be.true;
    });

    it('should deactivate car', async () => {
      const car = await Car.create({
        title: 'Active Car'
      });

      expect(car.isActive).to.be.true;

      car.isActive = false;
      await car.save();

      const inactiveCar = await Car.findById(car._id);
      expect(inactiveCar.isActive).to.be.false;
    });
  });

  describe('Car Timestamps', () => {
    it('should automatically add timestamps', async () => {
      const car = await Car.create({
        title: 'Timestamped Car'
      });

      expect(car.createdAt).to.be.instanceOf(Date);
      expect(car.updatedAt).to.be.instanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const car = await Car.create({
        title: 'Original Title'
      });

      const originalUpdatedAt = car.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      car.title = 'Updated Title';
      await car.save();

      expect(car.updatedAt.getTime()).to.be.greaterThan(originalUpdatedAt.getTime());
    });
  });
});
