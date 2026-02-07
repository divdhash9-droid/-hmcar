// [[ARABIC_HEADER]] هذا الملف (config/database.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * config/database.js
 * تهيئة قاعدة بيانات MongoDB Atlas
 * 
 * الوصف:
 * - هذا الملف يهتم بتهيئة الاتصال بقاعدة بيانات MongoDB Atlas
 * - يتضمن إعدادات الاتصال ووظائف إدارة الاتصال
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let mongoMemoryServer;

function isValidMongoUri(uri) {
  return typeof uri === 'string' && /^mongodb(\+srv)?:\/\//i.test(uri.trim());
}

function isOfflineUri(uri) {
  if (typeof uri !== 'string') return false;
  const v = uri.trim().toLowerCase();
  return v.startsWith('offline://') || v === 'localdb' || v === 'local-db';
}

function isMemoryMongoUri(uri) {
  return typeof uri === 'string' && uri.trim().toLowerCase().startsWith('memory://');
}

function loadLocalDbJson() {
  const localDbPath = path.join(process.cwd(), 'local-db.json');
  const raw = fs.readFileSync(localDbPath, 'utf8');
  return JSON.parse(raw);
}

async function ensureMemoryMongoStarted() {
  if (mongoMemoryServer) return mongoMemoryServer;

  // Lazy require so production installs (without devDependencies) don't break.
  // eslint-disable-next-line global-require
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongoMemoryServer = await MongoMemoryServer.create({
    instance: { dbName: 'car-auction' }
  });
  return mongoMemoryServer;
}

function matchesFilter(doc, filter) {
  if (!filter || typeof filter !== 'object') return true;
  for (const [key, expected] of Object.entries(filter)) {
    if (expected && typeof expected === 'object') {
      // Minimal local-db matching: unsupported operators are treated as non-match.
      return false;
    }
    if (doc?.[key] !== expected) return false;
  }
  return true;
}

function createCollectionOps(items) {
  const arr = Array.isArray(items) ? items : [];
  return {
    find: async (filter = {}) => arr.filter((d) => matchesFilter(d, filter)),
    findById: async (id) => arr.find((d) => String(d?._id ?? d?.id) === String(id)) || null,
    countDocuments: async (filter = {}) => arr.filter((d) => matchesFilter(d, filter)).length,
  };
}

function createLocalDbOperations(dbJson) {
  return {
    Car: createCollectionOps(dbJson?.cars),
    Brand: createCollectionOps(dbJson?.brands),
    Auction: createCollectionOps(dbJson?.auctions),
    Bid: createCollectionOps(dbJson?.bids),
    User: createCollectionOps(dbJson?.users),
    Notification: createCollectionOps(dbJson?.notifications),
  };
}

// تهيئة الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    // استخدام متغير البيئة MONGO_URI للاتصال بـ MongoDB Atlas
    const defaultLocalUri = 'mongodb://127.0.0.1:27017/car-auction';
    const envUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = !!process.env.VERCEL || !!process.env.NOW_REGION;

    // Explicit local JSON DB mode
    if (envUri && isOfflineUri(envUri)) {
      const dbJson = loadLocalDbJson();
      return {
        type: 'local',
        connection: null,
        operations: createLocalDbOperations(dbJson)
      };
    }

    // In-process MongoDB for local development
    if (envUri && isMemoryMongoUri(envUri)) {
      const ms = await ensureMemoryMongoStarted();
      const memUri = ms.getUri();
      const conn = await mongoose.connect(memUri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Database Connected (in-memory MongoDB)');
      return conn;
    }

    if ((isProduction || isVercel) && !envUri) {
      throw new Error('MONGO_URI (or MONGODB_URI) is required in production/serverless environments');
    }

    let mongoUri = envUri || defaultLocalUri;
    if (envUri && !isValidMongoUri(envUri)) {
      const msg = 'Invalid MONGO_URI scheme, expected mongodb:// or mongodb+srv://';
      if (isProduction) {
        throw new Error(msg);
      }
      console.warn(`⚠️ ${msg}. Falling back to local MongoDB URI.`);
      mongoUri = defaultLocalUri;
    }

    // خيارات الاتصال الموصى بها من MongoDB
    const options = {
      // Driver options: do not include deprecated flags (useNewUrlParser/useUnifiedTopology).
      serverSelectionTimeoutMS: isProduction ? 30000 : 2000, // faster dev fallback
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ Database Connected: ${conn.connection.host}`);

    // إعداد أحداث الاتصال
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB connection disconnected');
    });

    // التعامل مع إغلاق العملية
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.warn('⚠️ Database connection failed:', error.message);
    else console.error('❌ Database connection failed:', error.message);

    // IMPORTANT: Do NOT silently fall back to in-memory/local JSON DB here.
    // Those modes cause data loss across restarts and break "persist my data" expectations.
    // If the user wants offline/in-memory, they must explicitly set MONGO_URI to offline:// or memory://.
    throw error;
  }
};

// دالة للحصول على حالة الاتصال
const getConnectionStatus = () => {
  return mongoose.connection.readyState;
};

// خرائط حالة الاتصال
const connectionStates = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting'
};

module.exports = {
  connectDB,
  getConnectionStatus,
  connectionStates
};