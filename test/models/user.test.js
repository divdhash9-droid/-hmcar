// [[ARABIC_HEADER]] هذا الملف (test/models/user.test.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

describe('User Model Tests', () => {
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
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        name: 'Ahmed Ali',
        phone: '1234567890',
        password: 'SecurePass@123',
        role: 'admin'
      };

      const user = await User.create(userData);
      
      expect(user).to.have.property('_id');
      expect(user.name).to.equal('Ahmed Ali');
      expect(user.phone).to.equal('1234567890');
      expect(user.role).to.equal('admin');
      expect(user.status).to.equal('active');
    });

    it('should fail without required name', async () => {
      const userData = {
        phone: '1234567890',
        password: 'Test@123'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.name).to.exist;
      }
    });

    it('should hash password on creation', async () => {
      const plainPassword = 'MyPassword@123';
      const user = await User.create({
        name: 'Test User',
        phone: '9876543210',
        password: plainPassword,
        role: 'buyer'
      });

      expect(user.password).to.not.equal(plainPassword);
      expect(user.password).to.have.lengthOf.at.least(50); // bcrypt hash length
    });
  });

  describe('User Roles', () => {
    const roles = ['buyer', 'seller', 'admin', 'super_admin', 'manager'];

    roles.forEach(role => {
      it(`should accept ${role} role`, async () => {
        const user = await User.create({
          name: `${role} User`,
          phone: `${Math.random().toString().slice(2, 12)}`,
          password: 'Test@123',
          role: role
        });

        expect(user.role).to.equal(role);
      });
    });

    it('should default to buyer role', async () => {
      const user = await User.create({
        name: 'Default Role User',
        phone: '5555555555',
        password: 'Test@123'
      });

      expect(user.role).to.equal('buyer');
    });

    it('should reject invalid role', async () => {
      try {
        await User.create({
          name: 'Invalid Role',
          phone: '4444444444',
          password: 'Test@123',
          role: 'invalid_role'
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const plainPassword = 'ValidPass@123';
      const user = await User.create({
        name: 'Password Test',
        phone: '7777777777',
        password: plainPassword
      });

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).to.be.true;
    });

    it('should reject invalid password', async () => {
      const user = await User.create({
        name: 'Password Test 2',
        phone: '8888888888',
        password: 'CorrectPass@123'
      });

      const isMatch = await user.comparePassword('WrongPass@123');
      expect(isMatch).to.be.false;
    });

    it('should return false when user has no password', async () => {
      const user = await User.create({
        name: 'No Password User',
        buyerNameKey: '500000001'
      });

      const isMatch = await user.comparePassword('AnyPassword');
      expect(isMatch).to.be.false;
    });
  });

  describe('User Permissions', () => {
    const validPermissions = [
      'manage_users',
      'manage_settings',
      'manage_footer',
      'manage_whatsapp',
      'manage_cars',
      'manage_parts',
      'manage_auctions',
      'view_analytics',
      'manage_content'
    ];

    it('should accept valid permissions', async () => {
      const user = await User.create({
        name: 'Admin User',
        phone: '3333333333',
        password: 'Admin@123',
        role: 'admin',
        permissions: ['manage_users', 'manage_cars', 'view_analytics']
      });

      expect(user.permissions).to.be.an('array');
      expect(user.permissions).to.have.lengthOf(3);
      expect(user.permissions).to.include('manage_users');
      expect(user.permissions).to.include('manage_cars');
    });

    it('should reject invalid permissions', async () => {
      try {
        await User.create({
          name: 'Invalid Permission User',
          phone: '2222222222',
          password: 'Test@123',
          permissions: ['invalid_permission']
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('should allow empty permissions array', async () => {
      const user = await User.create({
        name: 'No Permissions User',
        phone: '1111111111',
        password: 'Test@123',
        permissions: []
      });

      expect(user.permissions).to.be.an('array');
      expect(user.permissions).to.have.lengthOf(0);
    });
  });

  describe('Login Attempts & Account Locking', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Login Test User',
        phone: '6666666666',
        password: 'Test@123'
      });
    });

    it('should increment login attempts', async () => {
      expect(user.loginAttempts).to.equal(0);

      await user.incLoginAttempts();
      const updatedUser = await User.findById(user._id);
      
      expect(updatedUser.loginAttempts).to.equal(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await user.incLoginAttempts();
        user = await User.findById(user._id);
      }

      expect(user.loginAttempts).to.equal(5);
      expect(user.lockUntil).to.exist;
      expect(user.lockUntil.getTime()).to.be.greaterThan(Date.now());
    });

    it('should reset login attempts on successful login', async () => {
      await user.incLoginAttempts();
      await user.incLoginAttempts();
      
      let updatedUser = await User.findById(user._id);
      expect(updatedUser.loginAttempts).to.equal(2);

      await updatedUser.resetLoginAttempts();
      updatedUser = await User.findById(user._id);
      
      expect(updatedUser.loginAttempts).to.equal(0);
      expect(updatedUser.lockUntil).to.not.exist;
    });

    it('should check if account is locked', async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        await user.incLoginAttempts();
        user = await User.findById(user._id);
      }

      expect(user.isLocked).to.be.true;
    });
  });

  describe('User Status', () => {
    const statuses = ['active', 'suspended', 'pending'];

    statuses.forEach(status => {
      it(`should accept ${status} status`, async () => {
        const user = await User.create({
          name: `${status} User`,
          phone: `${Math.random().toString().slice(2, 12)}`,
          password: 'Test@123',
          status: status
        });

        expect(user.status).to.equal(status);
      });
    });

    it('should default to active status', async () => {
      const user = await User.create({
        name: 'Default Status User',
        phone: '9999999999',
        password: 'Test@123'
      });

      expect(user.status).to.equal('active');
    });
  });

  describe('Unique Fields', () => {
    it('should enforce unique phone numbers', async () => {
      await User.create({
        name: 'User 1',
        phone: '1231231234',
        password: 'Test@123'
      });

      try {
        await User.create({
          name: 'User 2',
          phone: '1231231234',
          password: 'Test@123'
        });
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000);
      }
    });

    it('should enforce unique email addresses', async () => {
      await User.create({
        name: 'User 1',
        email: 'test@example.com',
        password: 'Test@123'
      });

      try {
        await User.create({
          name: 'User 2',
          email: 'test@example.com',
          password: 'Test@123'
        });
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000);
      }
    });

    it('should enforce unique buyerNameKey', async () => {
      await User.create({
        name: 'Buyer 1',
        buyerNameKey: '500000001',
        password: 'Test@123'
      });

      try {
        await User.create({
          name: 'Buyer 2',
          buyerNameKey: '500000001',
          password: 'Test@123'
        });
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000);
      }
    });
  });

  describe('Buyer Name Key', () => {
    it('should create buyer with buyerNameKey', async () => {
      const user = await User.create({
        name: 'Buyer User',
        buyerNameKey: '500000002',
        password: 'Buyer@123'
      });

      expect(user.buyerNameKey).to.equal('500000002');
    });

    it('should allow users without buyerNameKey', async () => {
      const user = await User.create({
        name: 'Admin User',
        phone: '5551234567',
        password: 'Admin@123',
        role: 'admin'
      });

      expect(user.buyerNameKey).to.be.undefined;
    });
  });

  describe('User Timestamps', () => {
    it('should track last login time', async () => {
      const user = await User.create({
        name: 'Login Tracker',
        phone: '4441234567',
        password: 'Test@123'
      });

      expect(user.lastLoginAt).to.be.null;

      user.lastLoginAt = new Date();
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLoginAt).to.be.instanceOf(Date);
    });

    it('should have createdAt and updatedAt timestamps', async () => {
      const user = await User.create({
        name: 'Timestamp User',
        phone: '3331234567',
        password: 'Test@123'
      });

      expect(user.createdAt).to.be.instanceOf(Date);
      expect(user.updatedAt).to.be.instanceOf(Date);
    });
  });
});
