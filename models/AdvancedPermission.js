// [[ARABIC_HEADER]] هذا الملف (models/AdvancedPermission.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  // اسم الصلاحية
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  // الوصف
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  // الفئة
  category: {
    type: String,
    enum: [
      'USER_MANAGEMENT', 'CONTENT_MANAGEMENT', 'SYSTEM_ADMINISTRATION',
      'FINANCIAL', 'REPORTS', 'SECURITY', 'COMMUNICATION', 'BACKUP',
      'API_ACCESS', 'DEVELOPMENT', 'MARKETING', 'SUPPORT'
    ],
    required: true
  },
  // نوع الصلاحية
  type: {
    type: String,
    enum: ['READ', 'WRITE', 'DELETE', 'ADMIN', 'CUSTOM'],
    required: true
  },
  // المستوى
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  // الموارد المرتبطة
  resources: [{
    type: String,
    enum: [
      'users', 'cars', 'auctions', 'bids', 'orders', 'payments',
      'reports', 'settings', 'notifications', 'backups', 'logs',
      'api', 'files', 'categories', 'brands', 'spare_parts'
    ]
  }],
  // الإجراءات المسموح بها
  actions: [{
    type: String,
    enum: [
      'create', 'read', 'update', 'delete', 'list', 'export',
      'import', 'approve', 'reject', 'publish', 'archive',
      'restore', 'backup', 'schedule', 'configure', 'monitor'
    ]
  }],
  // الشروط والقيود
  conditions: {
    // القيود الزمنية
    timeRestrictions: {
      allowedHours: {
        start: { type: Number, min: 0, max: 23 },
        end: { type: Number, min: 0, max: 23 }
      },
      allowedDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    // القيود الجغرافية
    locationRestrictions: {
      allowedIPs: [String],
      allowedCountries: [String],
      blockedIPs: [String],
      blockedCountries: [String]
    },
    // القيود على البيانات
    dataRestrictions: {
      ownDataOnly: { type: Boolean, default: false },
      departmentFilter: String,
      roleFilter: [String],
      customFilter: String
    },
    // القيود الكمية
    volumeRestrictions: {
      maxRequestsPerHour: Number,
      maxRecordsPerRequest: Number,
      maxExportSize: Number
    }
  },
  // الصلاحيات المطلوبة المسبقة
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvancedPermission'
  }],
  // الصلاحيات الحصرية
  exclusive: {
    type: Boolean,
    default: false
  },
  // الصلاحيات المتعارضة
  conflicts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvancedPermission'
  }],
  // حالة الصلاحية
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DEPRECATED'],
    default: 'ACTIVE'
  },
  // أولوية الصلاحية
  priority: {
    type: Number,
    default: 0
  },
  // هل هي صلاحية نظام
  isSystem: {
    type: Boolean,
    default: false
  },
  // من أنشأ الصلاحية
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // تاريخ انتهاء الصلاحية
  expiresAt: {
    type: Date,
    default: null
  },
  // سجل التغييرات
  changeLog: [{
    action: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'DEACTIVATED', 'ACTIVATED', 'DEPRECATED']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changes: mongoose.Schema.Types.Mixed,
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes
permissionSchema.index({ category: 1, status: 1 });
permissionSchema.index({ resources: 1 });
permissionSchema.index({ actions: 1 });
permissionSchema.index({ level: 1 });
permissionSchema.index({ status: 1 });
permissionSchema.index({ createdBy: 1 });

// Static methods
permissionSchema.statics.createPermission = async function(permissionData, userId) {
  try {
    const permission = new this({
      ...permissionData,
      createdBy: userId,
      changeLog: [{
        action: 'CREATED',
        changedBy: userId,
        changes: permissionData,
        reason: 'إنشاء صلاحية جديدة'
      }]
    });
    
    await permission.save();
    return permission;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

permissionSchema.statics.getPermissionsByCategory = async function(category) {
  return this.find({ category, status: 'ACTIVE' })
    .sort({ level: 1, name: 1 });
};

permissionSchema.statics.getSystemPermissions = async function() {
  return this.find({ isSystem: true, status: 'ACTIVE' })
    .sort({ category: 1, level: 1 });
};

permissionSchema.statics.checkPrerequisites = async function(permissionId, userPermissions) {
  const permission = await this.findById(permissionId).populate('prerequisites');
  
  if (!permission || !permission.prerequisites.length) {
    return true;
  }
  
  return permission.prerequisites.every(prereq => 
    userPermissions.some(userPerm => userPerm.toString() === prereq._id.toString())
  );
};

permissionSchema.statics.checkConflicts = async function(permissionId, userPermissions) {
  const permission = await this.findById(permissionId).populate('conflicts');
  
  if (!permission || !permission.conflicts.length) {
    return [];
  }
  
  return permission.conflicts.filter(conflict => 
    userPermissions.some(userPerm => userPerm.toString() === conflict._id.toString())
  );
};

// Instance methods
permissionSchema.methods.updatePermission = async function(updates, userId, reason = '') {
  try {
    const oldValues = {};
    const newValues = {};
    
    // تسجيل التغييرات
    Object.keys(updates).forEach(key => {
      if (this[key] !== updates[key]) {
        oldValues[key] = this[key];
        newValues[key] = updates[key];
      }
    });
    
    Object.assign(this, updates);
    
    this.changeLog.push({
      action: 'UPDATED',
      changedBy: userId,
      changedAt: new Date(),
      changes: { old: oldValues, new: newValues },
      reason
    });
    
    await this.save();
    return this;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
};

permissionSchema.methods.deactivate = async function(userId, reason = '') {
  this.status = 'INACTIVE';
  this.changeLog.push({
    action: 'DEACTIVATED',
    changedBy: userId,
    changedAt: new Date(),
    reason
  });
  
  await this.save();
  return this;
};

permissionSchema.methods.activate = async function(userId, reason = '') {
  this.status = 'ACTIVE';
  this.changeLog.push({
    action: 'ACTIVATED',
    changedBy: userId,
    changedAt: new Date(),
    reason
  });
  
  await this.save();
  return this;
};

permissionSchema.methods.deprecate = async function(userId, reason = '') {
  this.status = 'DEPRECATED';
  this.changeLog.push({
    action: 'DEPRECATED',
    changedBy: userId,
    changedAt: new Date(),
    reason
  });
  
  await this.save();
  return this;
};

permissionSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

permissionSchema.methods.canAccess = function(resource, action, userContext = {}) {
  // التحقق من حالة الصلاحية
  if (this.status !== 'ACTIVE' || this.isExpired()) {
    return false;
  }
  
  // التحقق من الموارد
  if (this.resources.length && !this.resources.includes(resource)) {
    return false;
  }
  
  // التحقق من الإجراءات
  if (this.actions.length && !this.actions.includes(action)) {
    return false;
  }
  
  // التحقق من القيود الزمنية
  if (this.conditions.timeRestrictions.allowedHours.start && 
      this.conditions.timeRestrictions.allowedHours.end) {
    const currentHour = new Date().getHours();
    const { start, end } = this.conditions.timeRestrictions.allowedHours;
    
    if (currentHour < start || currentHour > end) {
      return false;
    }
  }
  
  // التحقق من القيود الجغرافية
  if (this.conditions.locationRestrictions.allowedIPs.length && 
      userContext.ip) {
    if (!this.conditions.locationRestrictions.allowedIPs.includes(userContext.ip)) {
      return false;
    }
  }
  
  if (this.conditions.locationRestrictions.blockedIPs.length && 
      userContext.ip) {
    if (this.conditions.locationRestrictions.blockedIPs.includes(userContext.ip)) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('AdvancedPermission', permissionSchema);
