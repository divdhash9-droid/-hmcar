// [[ARABIC_HEADER]] هذا الملف (routes/permissions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const AdvancedPermission = require('../models/AdvancedPermission');
const Role = require('../models/Role');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// Middleware للتحقق من صلاحية إدارة الصلاحيات
const requirePermissionManagement = [requireAuth, requirePermission('manage_users')];

// Get all permissions
router.get('/', requirePermissionManagement, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      status,
      search,
      resource,
      action
    } = req.query;

    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (resource) filter.resources = resource;
    if (action) filter.actions = action;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [permissions, total] = await Promise.all([
      AdvancedPermission.find(filter)
        .populate('createdBy', 'name email')
        .populate('prerequisites', 'name')
        .populate('conflicts', 'name')
        .sort({ category: 1, level: 1, name: 1 })
        .limit(limit * 1)
        .skip(skip),
      AdvancedPermission.countDocuments(filter)
    ]);

    res.json({
      success: true,
      permissions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific permission
router.get('/:id', requirePermissionManagement, async (req, res) => {
  try {
    const permission = await AdvancedPermission.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('prerequisites', 'name description')
      .populate('conflicts', 'name description')
      .populate('changeLog.changedBy', 'name email');
    
    if (!permission) {
      return res.status(404).json({ error: 'الصلاحية غير موجودة' });
    }
    
    res.json({
      success: true,
      permission
    });
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new permission
router.post('/create', requirePermissionManagement, async (req, res) => {
  try {
    const permissionData = req.body;
    
    // التحقق من عدم وجود صلاحية بنفس الاسم
    const existingPermission = await AdvancedPermission.findOne({ name: permissionData.name });
    if (existingPermission) {
      return res.status(400).json({ error: 'صلاحية بهذا الاسم موجودة بالفعل' });
    }
    
    const permission = await AdvancedPermission.createPermission(permissionData, req.user._id);
    
    res.status(201).json({
      success: true,
      permission: await AdvancedPermission.findById(permission._id)
        .populate('createdBy', 'name email')
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update permission
router.put('/:id', requirePermissionManagement, async (req, res) => {
  try {
    const { updates, reason } = req.body;
    const permission = await AdvancedPermission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ error: 'الصلاحية غير موجودة' });
    }
    
    if (permission.isSystem) {
      return res.status(403).json({ error: 'لا يمكن تعديل صلاحيات النظام' });
    }
    
    await permission.updatePermission(updates, req.user._id, reason);
    
    res.json({
      success: true,
      permission: await AdvancedPermission.findById(permission._id)
        .populate('createdBy', 'name email')
        .populate('changeLog.changedBy', 'name email')
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deactivate permission
router.post('/:id/deactivate', requirePermissionManagement, async (req, res) => {
  try {
    const { reason } = req.body;
    const permission = await AdvancedPermission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ error: 'الصلاحية غير موجودة' });
    }
    
    if (permission.isSystem) {
      return res.status(403).json({ error: 'لا يمكن إلغاء صلاحيات النظام' });
    }
    
    await permission.deactivate(req.user._id, reason);
    
    res.json({
      success: true,
      message: 'تم إلغاء تفعيل الصلاحية'
    });
  } catch (error) {
    console.error('Error deactivating permission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Activate permission
router.post('/:id/activate', requirePermissionManagement, async (req, res) => {
  try {
    const { reason } = req.body;
    const permission = await AdvancedPermission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ error: 'الصلاحية غير موجودة' });
    }
    
    await permission.activate(req.user._id, reason);
    
    res.json({
      success: true,
      message: 'تم تفعيل الصلاحية'
    });
  } catch (error) {
    console.error('Error activating permission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get permissions by category
router.get('/category/:category', requirePermissionManagement, async (req, res) => {
  try {
    const permissions = await AdvancedPermission.getPermissionsByCategory(req.params.category);
    
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error fetching permissions by category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system permissions
router.get('/system/list', requirePermissionManagement, async (req, res) => {
  try {
    const permissions = await AdvancedPermission.getSystemPermissions();
    
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error fetching system permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check user permissions
router.post('/check', requireAuth, async (req, res) => {
  try {
    const { resource, action, userContext } = req.body;
    
    // الحصول على صلاحيات المستخدم
    const user = await User.findById(req.user._id).populate('role');
    if (!user || !user.role) {
      return res.json({ hasPermission: false, reason: 'المستخدم ليس لديه دور' });
    }
    
    const permissions = await user.role.getAllPermissions();
    
    // البحث عن صلاحية مطابقة
    const hasPermission = permissions.some(perm => 
      perm.canAccess(resource, action, userContext || {})
    );
    
    res.json({
      hasPermission,
      permissions: permissions.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        resources: p.resources,
        actions: p.actions
      }))
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get permission categories
router.get('/categories/list', requirePermissionManagement, async (req, res) => {
  try {
    const categories = [
      'USER_MANAGEMENT', 'CONTENT_MANAGEMENT', 'SYSTEM_ADMINISTRATION',
      'FINANCIAL', 'REPORTS', 'SECURITY', 'COMMUNICATION', 'BACKUP',
      'API_ACCESS', 'DEVELOPMENT', 'MARKETING', 'SUPPORT'
    ];
    
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await AdvancedPermission.countDocuments({ 
          category, 
          status: 'ACTIVE' 
        });
        return { category, count };
      })
    );
    
    res.json({
      success: true,
      categories: categoryStats
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// === ROLES ROUTES ===

// Get all roles
router.get('/roles/all', requirePermissionManagement, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      level
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (level) filter.level = level;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      Role.find(filter)
        .populate('permissions', 'name description level')
        .populate('inheritedRoles.role', 'name level')
        .populate('createdBy', 'name email')
        .sort({ level: 1, name: 1 })
        .limit(limit * 1)
        .skip(skip),
      Role.countDocuments(filter)
    ]);

    res.json({
      success: true,
      roles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific role
router.get('/roles/:id', requirePermissionManagement, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions', 'name description level category')
      .populate('inheritedRoles.role', 'name level description')
      .populate('deniedPermissions', 'name description')
      .populate('createdBy', 'name email')
      .populate('changeLog.changedBy', 'name email');
    
    if (!role) {
      return res.status(404).json({ error: 'الدور غير موجود' });
    }
    
    // الحصول على جميع الصلاحيات الفعالة
    const allPermissions = await role.getAllPermissions();
    
    res.json({
      success: true,
      role,
      allPermissions
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new role
router.post('/roles/create', requirePermissionManagement, async (req, res) => {
  try {
    const roleData = req.body;
    
    // التحقق من عدم وجود دور بنفس الاسم
    const existingRole = await Role.findOne({ name: roleData.name });
    if (existingRole) {
      return res.status(400).json({ error: 'دور بهذا الاسم موجود بالفعل' });
    }
    
    const role = await Role.createRole(roleData, req.user._id);
    
    res.status(201).json({
      success: true,
      role: await Role.findById(role._id)
        .populate('createdBy', 'name email')
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update role
router.put('/roles/:id', requirePermissionManagement, async (req, res) => {
  try {
    const { updates, reason } = req.body;
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'الدور غير موجود' });
    }
    
    if (role.isSystem) {
      return res.status(403).json({ error: 'لا يمكن تعديل أدوار النظام' });
    }
    
    // تسجيل التغييرات
    const oldValues = {};
    const newValues = {};
    
    Object.keys(updates).forEach(key => {
      if (role[key] !== updates[key]) {
        oldValues[key] = role[key];
        newValues[key] = updates[key];
      }
    });
    
    Object.assign(role, updates);
    
    role.changeLog.push({
      action: 'UPDATED',
      changedBy: req.user._id,
      changedAt: new Date(),
      changes: { old: oldValues, new: newValues },
      reason
    });
    
    await role.save();
    
    res.json({
      success: true,
      role: await Role.findById(role._id)
        .populate('createdBy', 'name email')
        .populate('changeLog.changedBy', 'name email')
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add permission to role
router.post('/roles/:id/permissions/:permissionId', requirePermissionManagement, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'الدور غير موجود' });
    }
    
    await role.addPermission(req.params.permissionId, req.user._id);
    
    res.json({
      success: true,
      message: 'تمت إضافة الصلاحية للدور'
    });
  } catch (error) {
    console.error('Error adding permission to role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove permission from role
router.delete('/roles/:id/permissions/:permissionId', requirePermissionManagement, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'الدور غير موجود' });
    }
    
    await role.removePermission(req.params.permissionId, req.user._id);
    
    res.json({
      success: true,
      message: 'تمت إزالة الصلاحية من الدور'
    });
  } catch (error) {
    console.error('Error removing permission from role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get role hierarchy
router.get('/roles/hierarchy', requirePermissionManagement, async (req, res) => {
  try {
    const roles = await Role.getRoleHierarchy();
    
    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching role hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system roles
router.get('/roles/system', requirePermissionManagement, async (req, res) => {
  try {
    const roles = await Role.getSystemRoles();
    
    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching system roles:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
