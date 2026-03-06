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
      user,
      'REGISTER',
      'User',
      'New user registration',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(err => console.error('AuditLog error:', err));

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
      newUser,
      'AUTO_REGISTER',
      'User',
      'Auto-registered new client',
      { name, ip: clientIP, deviceId }
    ).catch(() => {});

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

    const searchKey = (identifier || email || phone || name || '').trim();
    console.log(`[AUTH] Login attempt for: '${searchKey}', Role: ${role}`);

    if (!searchKey || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Identifier and password are required' });
    }

    // استخدام findOne بدل find لتفادي جلب كل المستخدمين
    const safeKey = searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: searchKey.toLowerCase() },
        { username: searchKey.toLowerCase() },
        { phone: searchKey },
        { name: { $regex: new RegExp(`^${safeKey}$`, 'i') } }
      ]
    }).select('+password').lean(false);

    if (!user) {
      console.warn(`[AUTH] User not found: ${searchKey}`);
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid credentials' });
    }

    // التحقق من كلمة المرور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[AUTH] Wrong password for: ${searchKey}`);
      // fire-and-forget — لا ننتظر AuditLog لتفادي timeout
      AuditLog.logUserAction(user, 'LOGIN', 'User', 'Failed login', { ipAddress: req.ip, result: 'FAILURE' }).catch(() => { });
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid credentials' });
    }

    // التحقق من الدور
    if (role === 'admin') {
      const adminRoles = ['admin', 'super_admin', 'manager'];
      if (!adminRoles.includes(user.role)) {
        console.warn(`[AUTH] Admin access denied for role: ${user.role}`);
        return res.status(403).json({ error: 'Access Denied', message: 'You are not authorized to access the admin portal' });
      }
    }

    // التحقق من حالة الحساب
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account Suspended', message: 'Your account has been suspended' });
    }

    // توليد التوكن
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d', issuer: 'hm-car-auction', audience: 'api-users' }
    );

    // تحديث وقت الدخول + AuditLog — fire-and-forget لا ننتظرهما
    User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }).catch(() => { });
    AuditLog.logUserAction(user, 'LOGIN', 'User', 'Successful login', { ipAddress: req.ip, result: 'SUCCESS' }).catch(() => { });

    console.log(`[AUTH] ✅ Login success: ${user.email} (${user.role})`);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions || [],
        lastLoginAt: user.lastLoginAt
      },
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during login' });
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
        user,
        'LOGOUT',
        'User',
        'User logged out',
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID || 'none',
          result: 'SUCCESS'
        }
      ).catch(() => {});
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
      user,
      'RESET_PASSWORD',
      'User',
      'Password changed by user',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(() => {});

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
      user,
      'RESET_PASSWORD',
      'User',
      'Password reset requested',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS',
        metadata: { resetToken }
      }
    ).catch(() => {});

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
      user,
      'RESET_PASSWORD',
      'User',
      'Password reset completed',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(() => {});

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
