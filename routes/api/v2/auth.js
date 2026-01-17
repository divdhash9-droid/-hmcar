// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/auth.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const { requireAuthAPI } = require('../../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password, role, deviceInfo } = req.body;
    
    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditLog.logUserAction(
        user._id,
        'LOGIN',
        'User',
        'Failed login attempt',
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          result: 'FAILURE',
          errorMessage: 'Invalid password'
        }
      );
      
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account Suspended',
        message: 'Your account has been suspended'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: '24h',
        issuer: 'hm-car-auction',
        audience: 'api-users'
      }
    );
    
    // Update last login
    user.lastLoginAt = new Date();
    user.activeSessionId = req.sessionID;
    await user.save();
    
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
      process.env.JWT_SECRET || 'your-secret-key',
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
      process.env.JWT_SECRET || 'your-secret-key',
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
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
