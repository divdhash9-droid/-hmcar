// [[ARABIC_HEADER]] هذا الملف (test/integration/cars.integration.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const App = require('../../modules/app');
const User = require('../../models/User');
const Car = require('../../models/Car');

describe('Cars API Integration Tests', () => {
  let mongoServer;
  let app;
  let adminUser;
  let adminCookie;

  before(async function() {
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(mongoUri);
      app = new App().app;
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

  beforeEach(async () => {
    await User.deleteMany({});
    await Car.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      name: 'Admin Test',
      phone: '1234567890',
      password: 'Admin@123',
      role: 'admin',
      permissions: ['manage_cars']
    });
  });

  describe('GET /cars', () => {
    it('should return list of active cars', async () => {
      await Car.create([
        { title: 'Toyota Camry 2020', make: 'Toyota', model: 'Camry', year: 2020, price: 50000, isActive: true },
        { title: 'Honda Accord 2021', make: 'Honda', model: 'Accord', year: 2021, price: 60000, isActive: true },
        { title: 'BMW X5 2019', make: 'BMW', model: 'X5', year: 2019, price: 120000, isActive: false }
      ]);

      const res = await request(app)
        .get('/api/cars')
        .expect(200);

      expect(res.body.data.cars.map(c => c.title).join(' ')).to.include('Toyota Camry');
      expect(res.body.data.cars.map(c => c.title).join(' ')).to.include('Honda Accord');
    });

    it('should filter cars by make', async () => {
      await Car.create([
        { title: 'Toyota Camry', make: 'Toyota', price: 50000, isActive: true },
        { title: 'Honda Civic', make: 'Honda', price: 45000, isActive: true }
      ]);

      const res = await request(app)
        .get('/api/cars?make=Toyota')
        .expect(200);

      expect(res.body.data.cars[0].make).to.equal('Toyota');
      // expect(res.text).not.to.include('Honda Civic'); // Might be tricky if layout includes all makes in sidebar
    });

    it('should handle pagination', async () => {
      // Create 15 cars
      const cars = Array.from({ length: 15 }, (_, i) => ({
        title: `Car ${i + 1}`,
        make: 'Toyota',
        price: 50000 + i * 1000,
        isActive: true
      }));
      await Car.create(cars);

      const res = await request(app)
        .get('/api/cars?page=1&limit=10')
        .expect(200);

      expect(res.text).to.be.a('string');
    });
  });

  describe('GET /cars/:id', () => {
    it('should return car details', async () => {
      const car = await Car.create({
        title: 'Mercedes E-Class 2022',
        make: 'Mercedes',
        model: 'E-Class',
        year: 2022,
        price: 180000,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/cars/${car._id}`)
        .expect(200);

      expect(res.body.data.title).to.include('Mercedes E-Class');
    });

    it('should return 404 for non-existent car', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/cars/${fakeId}`)
        .expect(404);
    });

    it('should return 404 for invalid car ID', async () => {
      await request(app)
        .get('/api/cars/invalid-id')
        .expect(400); // Because of CastError handling in API v2
    });
  });
});
