// [[ARABIC_HEADER]] هذا الملف (models/Backup.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const backupErrorSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  message: String,
  stack: String,
  collection: String,
  documentId: String
}, {
  _id: false,
  suppressReservedKeysWarning: true
});

const backupSchema = new mongoose.Schema({
  // اسم النسخة الاحتياطية
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // وصف النسخة الاحتياطية
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // نوع النسخة الاحتياطية
  type: {
    type: String,
    enum: ['FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'SELECTIVE'],
    required: true
  },
  // البيانات التي سيتم نسخها
  collections: [{
    name: {
      type: String,
      required: true
    },
    documents: {
      type: Number,
      default: 0
    },
    size: {
      type: Number,
      default: 0
    }
  }],
  // حالة النسخة الاحتياطية
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  // التقدم
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentCollection: {
      type: String,
      default: null
    },
    documentsProcessed: {
      type: Number,
      default: 0
    },
    totalDocuments: {
      type: Number,
      default: 0
    },
    estimatedTimeRemaining: {
      type: Number,
      default: null
    }
  },
  // معلومات الملف
  file: {
    name: String,
    path: String,
    size: Number,
    format: {
      type: String,
      enum: ['JSON', 'BSON', 'GZIP', 'ZIP'],
      default: 'JSON'
    },
    checksum: String,
    encrypted: {
      type: Boolean,
      default: false
    }
  },
  // التخزين السحابي
  cloudStorage: {
    provider: {
      type: String,
      enum: ['AWS_S3', 'GOOGLE_CLOUD', 'AZURE', 'DROPBOX', 'LOCAL'],
      default: 'LOCAL'
    },
    bucket: String,
    key: String,
    url: String,
    uploadedAt: Date
  },
  // الإعدادات
  settings: {
    // الضغط
    compression: {
      enabled: {
        type: Boolean,
        default: true
      },
      level: {
        type: Number,
        default: 6,
        min: 1,
        max: 9
      }
    },
    // التشفير
    encryption: {
      enabled: {
        type: Boolean,
        default: false
      },
      algorithm: {
        type: String,
        enum: ['AES256', 'AES128'],
        default: 'AES256'
      },
      keyId: String
    },
    // الاحتفاظ
    retention: {
      days: {
        type: Number,
        default: 30
      },
      copies: {
        type: Number,
        default: 5
      }
    }
  },
  // الجدولة
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
      default: 'DAILY'
    },
    nextRun: Date,
    lastRun: Date
  },
  // الإحصائيات
  stats: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    documentsBackedUp: Number,
    collectionsBackedUp: Number,
    sizeBeforeCompression: Number,
    sizeAfterCompression: Number,
    compressionRatio: Number
  },
  // الأخطاء
  errors: [backupErrorSchema],
  // من أنشأ النسخة
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // النسخة الاحتياطية الأصلية (للنسخ التزايدية)
  parentBackup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backup',
    default: null
  },
  // النسخ الاحتياطية الفرعية
  childBackups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backup'
  }],
  // الاستعادة
  restore: {
    available: {
      type: Boolean,
      default: true
    },
    lastRestoreDate: Date,
    restoreCount: {
      type: Number,
      default: 0
    },
    restoreHistory: [{
      restoredAt: Date,
      restoredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      collections: [String],
      status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PARTIAL']
      },
      duration: Number
    }]
  },
  // التحقق من الصحة
  verification: {
    lastVerified: Date,
    verified: {
      type: Boolean,
      default: false
    },
    checksum: String,
    integrityCheck: {
      passed: {
        type: Boolean,
        default: false
      },
      checkedAt: Date,
      errors: [String]
    }
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Indexes
backupSchema.index({ status: 1, createdAt: -1 });
backupSchema.index({ type: 1, createdAt: -1 });
backupSchema.index({ createdBy: 1, createdAt: -1 });
backupSchema.index({ 'schedule.nextRun': 1 });
backupSchema.index({ 'verification.lastVerified': -1 });

// Static methods
backupSchema.statics.createBackup = async function(backupData, userId) {
  try {
    const backup = new this({
      ...backupData,
      createdBy: userId,
      status: 'PENDING',
      'stats.startTime': new Date()
    });
    
    await backup.save();
    
    // بدء عملية النسخ الاحتياطي بشكل غير متزامن
    setImmediate(() => {
      backup.execute().catch(console.error);
    });
    
    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

backupSchema.statics.getScheduledBackups = async function() {
  return this.find({
    'schedule.enabled': true,
    'schedule.nextRun': { $lte: new Date() },
    status: { $ne: 'RUNNING' }
  });
};

backupSchema.statics.cleanupOldBackups = async function() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const oldBackups = await this.find({
    createdAt: { $lt: thirtyDaysAgo },
    status: 'COMPLETED'
  });
  
  for (const backup of oldBackups) {
    try {
      await backup.delete();
    } catch (error) {
      console.error(`Error deleting old backup ${backup._id}:`, error);
    }
  }
  
  return oldBackups.length;
};

// Instance methods
backupSchema.methods.execute = async function() {
  try {
    this.status = 'RUNNING';
    this.progress.percentage = 0;
    await this.save();
    
    // الحصول على قائمة المجموعات
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    this.progress.totalDocuments = 0;
    this.collections = [];
    
    // حساب إجمالي المستندات
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      this.progress.totalDocuments += count;
      this.collections.push({
        name: collection.name,
        documents: count,
        size: 0
      });
    }
    
    await this.save();
    
    // نسخ كل مجموعة
    let processedDocuments = 0;
    for (const collectionInfo of this.collections) {
      this.progress.currentCollection = collectionInfo.name;
      await this.save();
      
      try {
        await this.backupCollection(collectionInfo.name);
        processedDocuments += collectionInfo.documents;
        this.progress.documentsProcessed = processedDocuments;
        this.progress.percentage = Math.round((processedDocuments / this.progress.totalDocuments) * 100);
        await this.save();
      } catch (error) {
        this.errors.push({
          message: `Error backing up collection ${collectionInfo.name}: ${error.message}`,
          collection: collectionInfo.name,
          stack: error.stack
        });
      }
    }
    
    // إنهاء العملية
    this.status = 'COMPLETED';
    this.progress.percentage = 100;
    this.stats.endTime = new Date();
    this.stats.duration = this.stats.endTime - this.stats.startTime;
    this.stats.documentsBackedUp = this.progress.documentsProcessed;
    this.stats.collectionsBackedUp = this.collections.length;
    
    await this.save();
    
    // التحقق من النسخة
    await this.verify();
    
    return this;
  } catch (error) {
    this.status = 'FAILED';
    this.errors.push({
      message: error.message,
      stack: error.stack
    });
    this.stats.endTime = new Date();
    await this.save();
    throw error;
  }
};

backupSchema.methods.backupCollection = async function(collectionName) {
  const db = mongoose.connection.db;
  const collection = db.collection(collectionName);
  
  // هنا يتم تنفيذ عملية النسخ الفعلية
  // يمكن استخدام MongoDB's dump/restore أو طرق مخصصة
  
  console.log(`Backing up collection: ${collectionName}`);
  
  // محاكاة عملية النسخ
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};

backupSchema.methods.restoreBackup = async function(collections = null, userId) {
  try {
    if (!this.restore.available) {
      throw new Error('هذه النسخة الاحتياطية غير متاحة للاستعادة');
    }
    
    const restoreInfo = {
      restoredAt: new Date(),
      restoredBy: userId,
      collections: collections || this.collections.map(c => c.name),
      status: 'SUCCESS',
      duration: 0
    };
    
    // هنا يتم تنفيذ عملية الاستعادة الفعلية
    console.log(`Restoring backup: ${this.name}`);
    
    // محاكاة عملية الاستعادة
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.restore.restoreHistory.push(restoreInfo);
    this.restore.lastRestoreDate = restoreInfo.restoredAt;
    this.restore.restoreCount += 1;
    
    await this.save();
    
    return restoreInfo;
  } catch (error) {
    const restoreInfo = {
      restoredAt: new Date(),
      restoredBy: userId,
      collections: collections || [],
      status: 'FAILED',
      duration: 0
    };
    
    this.restore.restoreHistory.push(restoreInfo);
    await this.save();
    
    throw error;
  }
};

backupSchema.methods.verify = async function() {
  try {
    // التحقق من سلامة الملف
    const fs = require('fs');
    const crypto = require('crypto');
    
    if (this.file.path && fs.existsSync(this.file.path)) {
      const fileBuffer = fs.readFileSync(this.file.path);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      this.verification.checksum = checksum;
      this.verification.verified = true;
      this.verification.lastVerified = new Date();
      this.verification.integrityCheck.passed = true;
      this.verification.integrityCheck.checkedAt = new Date();
    }
    
    await this.save();
    return true;
  } catch (error) {
    this.verification.verified = false;
    this.verification.integrityCheck.passed = false;
    this.verification.integrityCheck.errors = [error.message];
    await this.save();
    return false;
  }
};

backupSchema.methods.delete = async function() {
  try {
    // حذف الملف
    if (this.file.path) {
      const fs = require('fs');
      if (fs.existsSync(this.file.path)) {
        fs.unlinkSync(this.file.path);
      }
    }
    
    // حذف من التخزين السحابي
    if (this.cloudStorage.url) {
      // هنا يتم حذف الملف من التخزين السحابي
      console.log(`Deleting from cloud storage: ${this.cloudStorage.url}`);
    }
    
    // حذف السجل من قاعدة البيانات
    await this.findByIdAndDelete(this._id);
    
    return true;
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
};

backupSchema.methods.isExpired = function() {
  if (!this.settings.retention.days) return false;
  const expiryDate = new Date(this.createdAt.getTime() + this.settings.retention.days * 24 * 60 * 60 * 1000);
  return new Date() > expiryDate;
};

module.exports = mongoose.model('Backup', backupSchema);
