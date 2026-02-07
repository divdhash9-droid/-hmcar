// [[ARABIC_HEADER]] هذا الملف (config/local-database.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * config/local-database.js
 * قاعدة بيانات محلية بسيطة كاحتياطي
 * 
 * الوصف:
 * - هذا الملف يوفر قاعدة بيانات محلية بسيطة باستخدام ملف JSON
 * - يُستخدم كاحتياطي عندما يفشل الاتصال بـ MongoDB Atlas
 */

const fs = require('fs');
const path = require('path');

// مسار ملف قاعدة البيانات المحلية
const DB_PATH = path.join(__dirname, '..', 'local-db.json');

// تهيئة قاعدة البيانات المحلية
let localDB = {};

// تحميل البيانات من الملف
function loadData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      localDB = JSON.parse(data);
    } else {
      // إنشاء قاعدة بيانات فارغة
      localDB = {
        users: [],
        cars: [],
        auctions: [],
        bids: [],
        notifications: []
      };
      saveData();
    }
  } catch (error) {
    console.error('خطأ في تحميل قاعدة البيانات المحلية:', error.message);
    localDB = {
      users: [],
      cars: [],
      auctions: [],
      bids: [],
      notifications: []
    };
  }
}

// حفظ البيانات في الملف
function saveData() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(localDB, null, 2));
  } catch (error) {
    console.error('خطأ في حفظ قاعدة البيانات المحلية:', error.message);
  }
}

// إنشاء قاعدة بيانات محلية
async function createLocalDB() {
  loadData();
  console.log('✅ قاعدة بيانات محلية جاهزة');
  return {
    db: localDB,
    save: saveData
  };
}

// محاكاة عمليات MongoDB
function mockMongoOperations(db) {
  return {
    // عمليات المستخدمين
    User: {
      find: (query = {}) => Promise.resolve(db.users.filter(user => {
        return Object.keys(query).every(key => user[key] === query[key]);
      })),
      findOne: (query = {}) => Promise.resolve(db.users.find(user => {
        return Object.keys(query).every(key => user[key] === query[key]);
      })),
      create: (data) => {
        const user = { ...data, _id: Date.now().toString(), createdAt: new Date() };
        db.users.push(user);
        saveData();
        return Promise.resolve(user);
      },
      findByIdAndUpdate: (id, update) => {
        const index = db.users.findIndex(user => user._id === id);
        if (index !== -1) {
          db.users[index] = { ...db.users[index], ...update };
          saveData();
          return Promise.resolve(db.users[index]);
        }
        return Promise.resolve(null);
      }
    },

    // عمليات السيارات
    Car: {
      find: (query = {}) => Promise.resolve(db.cars.filter(car => {
        return Object.keys(query).every(key => car[key] === query[key]);
      })),
      findOne: (query = {}) => Promise.resolve(db.cars.find(car => {
        return Object.keys(query).every(key => car[key] === query[key]);
      })),
      create: (data) => {
        const car = { ...data, _id: Date.now().toString(), createdAt: new Date() };
        db.cars.push(car);
        saveData();
        return Promise.resolve(car);
      }
    },

    // عمليات المزادات
    Auction: {
      find: (query = {}) => Promise.resolve(db.auctions.filter(auction => {
        return Object.keys(query).every(key => auction[key] === query[key]);
      })),
      create: (data) => {
        const auction = { ...data, _id: Date.now().toString(), createdAt: new Date() };
        db.auctions.push(auction);
        saveData();
        return Promise.resolve(auction);
      }
    },

    // عمليات العروض
    Bid: {
      find: (query = {}) => Promise.resolve(db.bids.filter(bid => {
        return Object.keys(query).every(key => bid[key] === query[key]);
      })),
      create: (data) => {
        const bid = { ...data, _id: Date.now().toString(), createdAt: new Date() };
        db.bids.push(bid);
        saveData();
        return Promise.resolve(bid);
      }
    }
  };
}

module.exports = {
  createLocalDB,
  mockMongoOperations
};
