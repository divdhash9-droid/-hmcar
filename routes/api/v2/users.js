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
    const allowedFields = ['name', 'email', 'phone'];
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

    // Check if email/phone is already taken by another user
    if (updates.email || updates.phone) {
      const existingUser = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(updates.email ? [{ email: updates.email }] : []),
          ...(updates.phone ? [{ phone: updates.phone }] : [])
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email or phone already exists'
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

// Create user (admin only)
router.post('/', requireAuthAPI, requirePermissionAPI('manage_users'), async (req, res) => {
  try {
    const { name, email, phone, password, role = 'buyer', permissions } = req.body;

    // Validation
    if (!name || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name and password are required'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email or phone is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email or phone already exists'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      permissions: permissions || [],
      status: 'active'
    });

    await user.save();

    // Log user creation
    await AuditLog.logUserAction(
      req.user.userId,
      'CREATE',
      'User',
      `Created new user: ${user.name}`,
      {
        targetId: user._id,
        after: user.toObject(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }
    );

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating user'
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
    const allowedUpdates = ['name', 'email', 'phone', 'role', 'status', 'permissions', 'boundDevices', 'isDeviceLocked'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check email/phone uniqueness
    if (updates.email || updates.phone) {
      const existingUser = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(updates.email ? [{ email: updates.email }] : []),
          ...(updates.phone ? [{ phone: updates.phone }] : [])
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email or phone already exists'
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
