// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/users.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const User = require('../../../models/User');
const AuditLog = require('../../../models/AuditLog');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');

// Get all users (admin only)
router.get('/', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fields
    } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Field selection
    const selectFields = fields ? fields.split(',') : '-password';

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(selectFields)
        .sort(sort)
        .limit(limit * 1)
        .skip(skip),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        search,
        role,
        status,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching users'
    });
  }
});

// Get current user profile
router.get('/profile', requireAuthAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Update current user profile
router.put('/profile', requireAuthAPI, async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'username'];
    const updates = {};

    // Only allow updating specific fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    // Check if email/phone/username is already taken by another user
    if (updates.email || updates.phone || updates.username) {
      const existingUser = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(updates.email ? [{ email: updates.email }] : []),
          ...(updates.phone ? [{ phone: updates.phone }] : []),
          ...(updates.username ? [{ username: updates.username }] : [])
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email, phone or username already exists'
        });
      }
    }

    const oldData = { ...user.toObject() };
    Object.assign(user, updates);
    await user.save();

    // Log profile update
    await AuditLog.logUserAction(
      user._id,
      'UPDATE',
      'User',
      'Profile updated by user',
      {
        targetId: user._id,
        before: oldData,
        after: user.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating profile'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user'
    });
  }
});

// إنشاء مستخدم جديد (الأدمن فقط)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      username,
      password,
      role = 'buyer',
      permissions,
      status = 'active',
      createdVia = 'admin-created'
    } = req.body;

    // ─── التحقق من البيانات المطلوبة ───
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'خطأ في البيانات',
        message: 'الاسم الكامل مطلوب'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'خطأ في البيانات',
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // للأدمن: الإيميل مطلوب كمعرف للدخول
    if (role === 'admin' || role === 'super_admin' || role === 'manager') {
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          error: 'خطأ في البيانات',
          message: 'البريد الإلكتروني مطلوب لحسابات المسؤولين'
        });
      }
    } else {
      // للعملاء: إيميل أو هاتف أو اسم مستخدم
      if (!email && !phone && !username) {
        return res.status(400).json({
          success: false,
          error: 'خطأ في البيانات',
          message: 'يجب توفير البريد الإلكتروني أو رقم الهاتف'
        });
      }
    }

    // ─── التحقق من عدم تكرار البيانات ───
    const orConditions = [];
    if (email && email.trim()) orConditions.push({ email: email.trim().toLowerCase() });
    if (phone && phone.trim()) orConditions.push({ phone: phone.trim() });
    if (username && username.trim()) orConditions.push({ username: username.trim() });

    if (orConditions.length > 0) {
      const existingUser = await User.findOne({ $or: orConditions });
      if (existingUser) {
        const field = existingUser.email === email?.toLowerCase() ? 'البريد الإلكتروني'
          : existingUser.phone === phone ? 'رقم الهاتف' : 'اسم المستخدم';
        return res.status(409).json({
          success: false,
          error: 'تعارض في البيانات',
          message: `${field} مستخدم بالفعل في النظام`
        });
      }
    }

    // ─── إنشاء المستخدم ───
    const userData = {
      name: name.trim(),
      password,
      role,
      permissions: (role === 'admin' || role === 'super_admin' || role === 'manager')
        ? (permissions || [])
        : [],
      status,
      createdVia,
      createdBy: req.user?.userId || null
    };

    // إضافة الحقول الاختيارية
    if (email && email.trim()) userData.email = email.trim().toLowerCase();
    if (phone && phone.trim()) userData.phone = phone.trim();
    if (username && username.trim()) userData.username = username.trim();

    const user = new User(userData);
    await user.save();

    // ─── تسجيل العملية في سجل التدقيق ───
    try {
      await AuditLog.logUserAction(
        req.user?.userId,
        'CREATE',
        'User',
        `أنشأ حساباً جديداً: ${user.name} (${user.role})`,
        {
          targetId: user._id,
          after: {
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    } catch (auditErr) {
      console.warn('⚠️ Audit log failed (non-critical):', auditErr.message);
    }

    // إرجاع البيانات بدون كلمة المرور
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: { ...userResponse, id: user._id },
      message: `✅ تم إنشاء حساب ${user.name} بنجاح`
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    // خطأ تكرار المفتاح الفريد
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const fieldNames = { email: 'البريد الإلكتروني', phone: 'رقم الهاتف', username: 'اسم المستخدم' };
      return res.status(409).json({
        success: false,
        error: 'تعارض في البيانات',
        message: `${fieldNames[field] || field} مستخدم بالفعل في النظام`
      });
    }
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      message: 'حدث خطأ أثناء إنشاء الحساب'
    });
  }
});

// Update user (admin only)
router.put('/:id', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Prevent updating super admin unless you are super admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot update super admin user'
      });
    }

    const oldData = { ...user.toObject() };
    const allowedUpdates = ['name', 'email', 'phone', 'username', 'role', 'status', 'permissions', 'boundDevices', 'isDeviceLocked', 'password'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check email/phone/username uniqueness
    if (updates.email || updates.phone || updates.username) {
      const existingUser = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(updates.email ? [{ email: updates.email }] : []),
          ...(updates.phone ? [{ phone: updates.phone }] : []),
          ...(updates.username ? [{ username: updates.username }] : [])
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email, phone or username already exists'
        });
      }
    }

    Object.assign(user, updates);
    await user.save();

    // Log user update
    await AuditLog.logUserAction(
      req.user.userId,
      'UPDATE',
      'User',
      `Updated user: ${user.name}`,
      {
        targetId: user._id,
        before: oldData,
        after: user.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating user'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete super admin user'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log user deletion
    await AuditLog.logUserAction(
      req.user.userId,
      'DELETE',
      'User',
      `Deleted user: ${user.name}`,
      {
        targetId: user._id,
        before: user.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting user'
    });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', requireAuthAPI, requirePermissionAPI('view_analytics'), async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentUsers,
      usersByMonth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: { $ne: 'active' } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.find({ status: 'active' })
        .sort({ lastLoginAt: -1 })
        .limit(10)
        .select('name email role lastLoginAt'),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: usersByRole,
        recent: recentUsers,
        byMonth: usersByMonth
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user statistics'
    });
  }
});

// Suspend/unsuspend user (admin only)
router.post('/:id/suspend', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Prevent suspending super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot suspend super admin user'
      });
    }

    const oldStatus = user.status;
    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();

    // Log suspension/activation
    await AuditLog.logUserAction(
      req.user.userId,
      user.status === 'suspended' ? 'SUSPEND' : 'ACTIVATE',
      'User',
      `${user.status === 'suspended' ? 'Suspended' : 'Activated'} user: ${user.name}`,
      {
        targetId: user._id,
        before: { status: oldStatus },
        after: { status: user.status },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { reason }
      }
    );

    res.json({
      success: true,
      data: user,
      message: `User ${user.status === 'suspended' ? 'suspended' : 'activated'} successfully`
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating user status'
    });
  }
});

module.exports = router;
