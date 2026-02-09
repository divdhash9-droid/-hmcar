// [[ARABIC_HEADER]] هذا الملف (config/database.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const LOCAL_DB_PATH = path.join(__dirname, '..', 'local-db.json');
const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/car-auction';

let memoryServerPromise;

function isOfflineUri(uri) {
  const v = String(uri || '').trim().toLowerCase();
  return v.startsWith('offline://') || v === 'localdb' || v === 'local-db';
}

function isMemoryMongoUri(uri) {
  const v = String(uri || '').trim().toLowerCase();
  return v.startsWith('memory://');
}

function isValidMongoUri(uri) {
  const v = String(uri || '').trim().toLowerCase();
  return v.startsWith('mongodb://') || v.startsWith('mongodb+srv://');
}

function loadLocalDbJson() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch (e) {
    console.warn('⚠️ Failed to read local-db.json:', e.message);
  }

  // Default shape: keep common collections present
  return {
    users: [],
    cars: [],
    brands: [],
    auctions: [],
    bids: [],
    spareParts: [],
    settings: [],
  };
}

function saveLocalDbJson(db) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.warn('⚠️ Failed to write local-db.json:', e.message);
  }
}

function matchesQuery(doc, query) {
  if (!query || typeof query !== 'object') return true;
  const keys = Object.keys(query);
  return keys.every((k) => {
    // Minimal matcher: equality only
    return doc && Object.prototype.hasOwnProperty.call(doc, k) && doc[k] === query[k];
  });
}

function createCollectionOps(db, collectionKey) {
  if (!db[collectionKey]) db[collectionKey] = [];

  return {
    find: async (query = {}) => {
      const arr = Array.isArray(db[collectionKey]) ? db[collectionKey] : [];
      return arr.filter((d) => matchesQuery(d, query));
    },
    findOne: async (query = {}) => {
      const arr = Array.isArray(db[collectionKey]) ? db[collectionKey] : [];
      return arr.find((d) => matchesQuery(d, query)) || null;
    },
    create: async (data) => {
      const doc = {
        ...data,
        _id: (data && data._id) ? String(data._id) : String(Date.now()),
        createdAt: (data && data.createdAt) ? data.createdAt : new Date(),
      };
      db[collectionKey].push(doc);
      saveLocalDbJson(db);
      return doc;
    },
  };
}

function createLocalDbOperations(db) {
  // Map model names used by the app to JSON keys
  return {
    User: createCollectionOps(db, 'users'),
    Car: createCollectionOps(db, 'cars'),
    Brand: createCollectionOps(db, 'brands'),
    Auction: createCollectionOps(db, 'auctions'),
    Bid: createCollectionOps(db, 'bids'),
    SparePart: createCollectionOps(db, 'spareParts'),
    Settings: createCollectionOps(db, 'settings'),
  };
}

async function ensureMemoryMongoStarted() {
  if (!memoryServerPromise) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServerPromise = MongoMemoryServer.create({
      instance: { dbName: 'car-auction' },
    });
  }
  return memoryServerPromise;
}

function bindMongooseEventsOnce() {
  if (mongoose.connection.__hmEventsBound) return;
  mongoose.connection.__hmEventsBound = true;

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB connection disconnected');
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
    } finally {
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    }
  });
}

async function connectDB() {
  const envUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = !!process.env.VERCEL || !!process.env.NOW_REGION;

  try {
    // Explicit local JSON DB mode
    if (envUri && isOfflineUri(envUri)) {
      const dbJson = loadLocalDbJson();
      return {
        type: 'local',
        connection: null,
        operations: createLocalDbOperations(dbJson),
      };
    }

    // In-process MongoDB for local development/testing
    if (envUri && isMemoryMongoUri(envUri)) {
      const ms = await ensureMemoryMongoStarted();
      const memUri = ms.getUri();
      const conn = await mongoose.connect(memUri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
      });
      bindMongooseEventsOnce();
      console.log('✅ Database Connected (in-memory MongoDB)');
      return conn;
    }

    if ((isProduction || isVercel) && !envUri) {
      throw new Error('MONGO_URI (or MONGODB_URI) is required in production/serverless environments');
    }

    let mongoUri = envUri || DEFAULT_LOCAL_URI;
    if (envUri && !isValidMongoUri(envUri)) {
      const msg = 'Invalid MONGO_URI scheme, expected mongodb:// or mongodb+srv://';
      if (isProduction) throw new Error(msg);
      console.warn(`⚠️ ${msg}. Falling back to local MongoDB URI.`);
      mongoUri = DEFAULT_LOCAL_URI;
    }

    const options = {
      serverSelectionTimeoutMS: isProduction ? 30000 : 2000,
      bufferCommands: false,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoUri, options);
    bindMongooseEventsOnce();
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.warn('⚠️ Database connection failed:', error.message);
    else console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

const getConnectionStatus = () => mongoose.connection.readyState;

const connectionStates = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting',
};

module.exports = {
  connectDB,
  getConnectionStatus,
  connectionStates,
};