// [[ARABIC_HEADER]] هذا الملف (models/Role.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  // اسم الدور
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  // الاسم المعروض
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // الوصف
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // مستوى الدور
  level: {
    type: Number,
    min: 1,
    max: 100,
    required: true
  },
  // الصلاحيات المباشرة
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvancedPermission'
  }],
  // الصلاحيات الموروثة من أدوار أخرى
  inheritedRoles: [{
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    inheritedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // الصلاحيات المحظورة (تجاوز الصلاحيات الموروثة)
  deniedPermissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvancedPermission'
  }],
  // حالة الدور
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DEPRECATED'],
    default: 'ACTIVE'
  },
  // هل هو دور نظام
  isSystem: {
    type: Boolean,
    default: false
  },
  // هل هو دور افتراضي للمستخدمين الجدد
  isDefault: {
    type: Boolean,
    default: false
  },
  // الحد الأقصى لعدد المستخدمين
  maxUsers: {
    type: Number,
    default: null
  },
  // شروط تعيين الدور
  assignmentConditions: {
    minAge: Number,
    maxAge: Number,
    requiredExperience: Number,
    requiredSkills: [String],
    customConditions: String
  },
  // صلاحيات إضافية مخصصة
  customPermissions: [{
    name: String,
    description: String,
    resources: [String],
    actions: [String],
    conditions: mongoose.Schema.Types.Mixed
  }],
  // من أنشأ الدور
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  }],
  // الإحصائيات
  stats: {
    userCount: {
      type: Number,
      default: 0
    },
    lastAssignedAt: Date,
    lastUsedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ status: 1, level: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ isDefault: 1 });
roleSchema.index({ createdBy: 1 });

// Static methods
roleSchema.statics.createRole = async function(roleData, userId) {
  try {
    const role = new this({
      ...roleData,
      createdBy: userId,
      changeLog: [{
        action: 'CREATED',
        changedBy: userId,
        changes: roleData,
        reason: 'إنشاء دور جديد'
      }]
    });
    
    await role.save();
    return role;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

roleSchema.statics.getDefaultRole = async function() {
  return this.findOne({ isDefault: true, status: 'ACTIVE' });
};

roleSchema.statics.getSystemRoles = async function() {
  return this.find({ isSystem: true, status: 'ACTIVE' })
    .sort({ level: 1, name: 1 });
};

roleSchema.statics.getRoleHierarchy = async function() {
  const roles = await this.find({ status: 'ACTIVE' })
    .populate('permissions', 'name description level')
    .populate('inheritedRoles.role', 'name level')
    .sort({ level: 1 });
  
  return roles;
};

roleSchema.statics.checkRoleAssignment = async function(roleId, userData) {
  const role = await this.findById(roleId);
  
  if (!role || role.status !== 'ACTIVE') {
    return { allowed: false, reason: 'الدور غير موجود أو غير نشط' };
  }
  
  if (role.maxUsers && role.stats.userCount >= role.maxUsers) {
    return { allowed: false, reason: 'تم الوصول إلى الحد الأقصى للمستخدمين' };
  }
  
  // التحقق من شروط التعيين
  if (role.assignmentConditions.minAge && userData.age < role.assignmentConditions.minAge) {
    return { allowed: false, reason: 'العمر أقل من الحد الأدنى المطلوب' };
  }
  
  if (role.assignmentConditions.maxAge && userData.age > role.assignmentConditions.maxAge) {
    return { allowed: false, reason: 'العمر يتجاوز الحد الأقصى المسموح' };
  }
  
  return { allowed: true };
};

// Instance methods
roleSchema.methods.getAllPermissions = async function() {
  const AdvancedPermission = mongoose.model('AdvancedPermission');
  
  // الحصول على الصلاحيات المباشرة
  const directPermissions = await AdvancedPermission.find({
    _id: { $in: this.permissions },
    status: 'ACTIVE'
  });
  
  // الحصول على الصلاحيات الموروثة
  let inheritedPermissions = [];
  for (const inheritedRole of this.inheritedRoles) {
    const role = await this.model('Role').findById(inheritedRole.role);
    if (role && role.status === 'ACTIVE') {
      const rolePermissions = await role.getAllPermissions();
      inheritedPermissions = inheritedPermissions.concat(rolePermissions);
    }
  }
  
  // دمج الصلاحيات وإزالة المكرر
  const allPermissions = [...directPermissions, ...inheritedPermissions];
  const uniquePermissions = allPermissions.filter((perm, index, arr) => 
    arr.findIndex(p => p._id.toString() === perm._id.toString()) === index
  );
  
  // إزالة الصلاحيات المحظورة
  const deniedPermissions = await AdvancedPermission.find({
    _id: { $in: this.deniedPermissions },
    status: 'ACTIVE'
  });
  
  const deniedIds = deniedPermissions.map(p => p._id.toString());
  const finalPermissions = uniquePermissions.filter(perm => 
    !deniedIds.includes(perm._id.toString())
  );
  
  return finalPermissions;
};

roleSchema.methods.hasPermission = async function(permissionName, resource, action, userContext = {}) {
  const permissions = await this.getAllPermissions();
  
  // البحث عن صلاحية مطابقة
  const matchingPermission = permissions.find(perm => 
    perm.name === permissionName && 
    perm.canAccess(resource, action, userContext)
  );
  
  return !!matchingPermission;
};

roleSchema.methods.addPermission = async function(permissionId, userId) {
  if (!this.permissions.includes(permissionId)) {
    this.permissions.push(permissionId);
    
    this.changeLog.push({
      action: 'UPDATED',
      changedBy: userId,
      changedAt: new Date(),
      changes: { addedPermission: permissionId },
      reason: 'إضافة صلاحية جديدة للدور'
    });
    
    await this.save();
  }
  
  return this;
};

roleSchema.methods.removePermission = async function(permissionId, userId) {
  this.permissions = this.permissions.filter(id => id.toString() !== permissionId.toString());
  
  this.changeLog.push({
    action: 'UPDATED',
    changedBy: userId,
    changedAt: new Date(),
    changes: { removedPermission: permissionId },
    reason: 'إزالة صلاحية من الدور'
  });
  
  await this.save();
  return this;
};

roleSchema.methods.inheritRole = async function(roleId, userId) {
  if (!this.inheritedRoles.some(ir => ir.role.toString() === roleId.toString())) {
    this.inheritedRoles.push({
      role: roleId,
      inheritedAt: new Date()
    });
    
    this.changeLog.push({
      action: 'UPDATED',
      changedBy: userId,
      changedAt: new Date(),
      changes: { inheritedRole: roleId },
      reason: 'وراثة دور جديد'
    });
    
    await this.save();
  }
  
  return this;
};

roleSchema.methods.denyPermission = async function(permissionId, userId) {
  if (!this.deniedPermissions.includes(permissionId)) {
    this.deniedPermissions.push(permissionId);
    
    this.changeLog.push({
      action: 'UPDATED',
      changedBy: userId,
      changedAt: new Date(),
      changes: { deniedPermission: permissionId },
      reason: 'حظر صلاحية للدور'
    });
    
    await this.save();
  }
  
  return this;
};

roleSchema.methods.updateStats = async function() {
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({ role: this._id });
  
  this.stats.userCount = userCount;
  this.stats.lastUsedAt = new Date();
  
  await this.save();
};

roleSchema.methods.canAssignToUser = async function(userData) {
  return this.constructor.checkRoleAssignment(this._id, userData);
};

module.exports = mongoose.model('Role', roleSchema);
