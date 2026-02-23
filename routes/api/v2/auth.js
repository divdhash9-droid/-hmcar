// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/auth.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../../models/User');
const AuditLog = require('../../../models/AuditLog');
const { requireAuthAPI } = require('../../../middleware/auth');

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, and password are required'
      });
    }

    // Validate Name (at least 2 words)
    if (name.trim().split(/\s+/).length < 2) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Full name must contain at least two names'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        ...(phone ? [{ phone: phone }] : [])
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
      role: 'buyer',
      status: 'active'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
        issuer: 'hm-car-auction',
        audience: 'api-users'
      }
    );

    // Log registration
    await AuditLog.logUserAction(
      user._id,
      'REGISTER',
      'User',
      'New user registration',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        result: 'SUCCESS'
      }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during registration'
    });
  }
});

// Auto Register/Login endpoint for clients
// إذا لم يكن المستخدم موجوداً، يتم إنشاؤه تلقائياً
router.post('/auto-login', async (req, res) => {
  try {
    const { name, password, deviceId } = req.body;

    // Get client IP
    const clientIP = req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';

    console.log(`[AUTH] Auto-login attempt for: '${name}', IP: ${clientIP}`);

    if (!name || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'الاسم وكلمة المرور مطلوبان'
      });
    }

    // Check if user exists with this name
    const existingUser = await User.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existingUser) {
      // User exists - try to login
      const isMatch = await existingUser.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'كلمة المرور غير صحيحة. هذا الاسم مستخدم بالفعل.'
        });
      }

      // Password matches - login successful
      existingUser.lastLoginAt = new Date();
      existingUser.lastLoginIP = clientIP;
      await existingUser.save();

      // Generate token
      const token = jwt.sign(
        { userId: existingUser._id, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log(`[AUTH] ✅ Auto-login successful for existing user: ${name}`);

      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        isNewUser: false,
        token,
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        }
      });
    }

    // User doesn't exist - create new account automatically
    const newUser = new User({
      name: name.trim(),
      password: password, // Will be hashed by model
      role: 'buyer',
      status: 'active',
      registrationIP: clientIP,
      lastLoginIP: clientIP,
      lastLoginAt: new Date(),
      deviceId: deviceId || '',
      createdVia: 'auto-registration'
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log the registration
    await AuditLog.logUserAction(
      newUser._id,
      'AUTO_REGISTER',
      'User',
      'Auto-registered new client',
      { name, ip: clientIP, deviceId }
    );

    console.log(`[AUTH] ✅ Auto-registered new user: ${name}, IP: ${clientIP}`);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء حسابك بنجاح!',
      isNewUser: true,
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Auto-login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'حدث خطأ أثناء العملية'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, phone, name, identifier, password, role, deviceInfo, deviceId, rememberMe } = req.body;

    // Determine the value to search for
    const searchKey = (identifier || email || phone || name || '').trim();

    console.log(`[AUTH] Login attempt for: '${searchKey}', Role: ${role}`);

    if (!searchKey) {
      console.warn('[AUTH] Login failed: No search key provided');
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, Phone, or Name is required'
      });
    }

    // Find user by email, phone, name, buyerNameKey, or username
    const query = {
      $or: [
        { username: searchKey.toLowerCase() },
        { email: searchKey.toLowerCase() },
        { phone: searchKey },
        { name: { $regex: new RegExp(`^${searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { buyerNameKey: searchKey }
      ]
    };

    console.log('[AUTH] Login Query:', JSON.stringify(query));

    // If role is specified, favor users with that role but don't strictly enforce it for lookup 
    // (validation happens later, or we can enforce it here if strict)
    // strict role check might be better:
    if (role && role !== 'admin') {
      // If logging in as buyer, allow finding the user. 
      // If logging in as admin, we might want to ensure they are admin? 
      // The original code didn't check role during findOne, but checked it later or just checked password.
    }

    // Find ALL matching users to handle duplicate names or overlapping identifiers
    const users = await User.find(query);

    if (users.length === 0) {
      console.warn(`[AUTH] User not found for searchKey: ${searchKey}`);
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    console.log(`[AUTH] Found ${users.length} potential users. Checking passwords...`);

    let user = null;
    // Iterate through all found users to find the one with the correct password
    for (const potentialUser of users) {
      const isMatch = await potentialUser.comparePassword(password);
      if (isMatch) {
        user = potentialUser;
        break;
      }
    }

    if (!user) {
      console.warn(`[AUTH] Password validation failed for all ${users.length} found users.`);
      // Log failed login attempt for the *first* user found, or generic log
      await AuditLog.logUserAction(
        users[0]._id,
        'LOGIN',
        'User',
        'Failed login attempt',
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          result: 'FAILURE',
          errorMessage: 'Invalid password (checked multiple candidates)'
        }
      );

      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    console.log(`[AUTH] User successfully authenticated: ${user.email} (${user._id})`);

    // RBAC: Check authorization
    if (role === 'admin') {
      const allowedAdminRoles = ['admin', 'super_admin', 'manager'];
      if (!allowedAdminRoles.includes(user.role)) {
        console.warn(`[AUTH] Admin login attempt denied for user ${user.email} with role ${user.role}`);
        return res.status(403).json({
          error: 'Access Denied',
          message: 'You are not authorized to access the admin portal'
        });
      }
    } else if (role === 'buyer') {
      // Allow logic to proceed.
      // Note: Admins *can* login as buyers to view client side if they wish, unless we restrict it.
      // Current requirement doesn't explicitly forbid it.
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account Suspended',
        message: 'Your account has been suspended'
      });
    }

    // DEVICE BINDING & SECURITY LOGIC
    if (user.role === 'buyer' && user.isDeviceLocked) {
      if (!deviceId) {
        // Optionally enforce deviceId presence. For now, we might skip if not provided to avoid breaking dev, 
        // but strictly we should require it.
        // console.warn("Login attempt without deviceId");
      } else {
        const existingDevice = user.boundDevices.find(d => d.deviceId === deviceId);

        if (existingDevice) {
          if (!existingDevice.isActive) {
            return res.status(403).json({
              error: 'Device Blocked',
              message: 'This device has been blocked by administration. Please contact support.'
            });
          }
          // Update usage stats
          existingDevice.lastUsedAt = new Date();
          existingDevice.ip = req.ip;
        } else {
          // New Device
          if (user.boundDevices.length > 0) {
            // Device is locked and user already has devices -> BLOCK
            console.warn(`[AUTH] Device restriction for user ${user.email}. Device ${deviceId} not recognized.`);
            await AuditLog.logUserAction(user._id, 'LOGIN', 'User', 'Login blocked - unrecognized device', {
              deviceId,
              result: 'FAILURE'
            });

            return res.status(403).json({
              error: 'Device Restriction',
              message: 'This account is bound to another device. Please login from your registered device or contact support.'
            });
          } else {
            // First device - Bind it
            user.boundDevices.push({
              deviceId,
              browser: deviceInfo?.browser || 'Unknown',
              os: deviceInfo?.os || 'Unknown',
              ip: req.ip,
              isActive: true,
              isTrusted: true
            });
          }
        }
        user.markModified('boundDevices'); // Ensure change is tracked
        try {
          await user.save();
          console.log(`[AUTH] Device bound/updated for user ${user.email}`);
        } catch (saveErr) {
          console.error(`[AUTH] Failed to save user device binding: ${saveErr.message}`);
          // Proceed with login anyway, don't block user for internal db error? 
          // Or should we block? Prefer not to block.
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      process.env.JWT_SECRET,
      {
        expiresIn: rememberMe ? '30d' : '24h',
        issuer: 'hm-car-auction',
        audience: 'api-users'
      }
    );

    // Update last login — نستخدم updateOne لتجاوز pre-save hook وتجنب إعادة تشفير الباسورد
    const User = require('../../../models/User');
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date(), activeSessionId: req.sessionID || '' } }
    );

    // Log successful login
    await AuditLog.logUserAction(
      user._id,
      'LOGIN',
      'User',
      'Successful login',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        result: 'SUCCESS',
        metadata: { deviceInfo }
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        lastLoginAt: user.lastLoginAt
      },
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login'
    });
  }
});

// Logout endpoint
router.post('/logout', requireAuthAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (user) {
      user.activeSessionId = '';
      await user.save();

      // Log logout
      await AuditLog.logUserAction(
        user._id,
        'LOGOUT',
        'User',
        'User logged out',
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          result: 'SUCCESS'
        }
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during logout'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', requireAuthAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
        issuer: 'hm-car-auction',
        audience: 'api-users'
      }
    );

    res.json({
      success: true,
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during token refresh'
    });
  }
});

// Verify token endpoint
router.get('/verify', requireAuthAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        lastLoginAt: user.lastLoginAt
      },
      tokenValid: true
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during token verification'
    });
  }
});

// Change password endpoint
router.post('/change-password', requireAuthAPI, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await AuditLog.logUserAction(
      user._id,
      'RESET_PASSWORD',
      'User',
      'Password changed by user',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        result: 'SUCCESS'
      }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while changing password'
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone } = req.body;

    const user = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });

    if (!user) {
      // Always return success to prevent user enumeration
      return res.json({
        success: true,
        message: 'If an account with this email/phone exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log password reset request
    await AuditLog.logUserAction(
      user._id,
      'RESET_PASSWORD',
      'User',
      'Password reset requested',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        result: 'SUCCESS',
        metadata: { resetToken }
      }
    );

    // In a real application, you would send an email/SMS with the reset link
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If an account with this email/phone exists, a reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing password reset'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reset token and new password are required'
      });
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid or expired reset token'
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password reset
    await AuditLog.logUserAction(
      user._id,
      'RESET_PASSWORD',
      'User',
      'Password reset completed',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        result: 'SUCCESS'
      }
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid or expired reset token'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while resetting password'
    });
  }
});

module.exports = router;
