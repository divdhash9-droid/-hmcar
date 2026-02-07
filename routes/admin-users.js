// Admin User Management Routes
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Admin middleware
const requireAdmin = [requireAuth, requireRole(['admin', 'super_admin', 'manager'])];

// Edit User
router.post('/users/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, deviceLockEnabled, deviceAccountLimit } = req.body;
    const userId = req.params.id;
    
    console.log('🔧 Editing user:', userId, { name, email, phone });
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    // Only allow editing buyers
    if (user.role !== 'buyer') {
      return res.json({ success: false, message: 'لا يمكن تعديل بيانات المشرفين' });
    }
    
    // Update user data
    if (name) {
      user.name = name.trim();
      user.buyerNameKey = name.trim().toLowerCase();
    }
    if (email) user.email = email.trim();
    if (phone) user.phone = phone.trim();

    if (typeof deviceLockEnabled !== 'undefined') {
      user.deviceLockEnabled = String(deviceLockEnabled) === 'true' || deviceLockEnabled === true;
    }

    if (typeof deviceAccountLimit !== 'undefined') {
      const parsedLimit = parseInt(deviceAccountLimit, 10);
      user.deviceAccountLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 1;
    }
    
    await user.save();
    
    console.log('✅ User updated successfully:', user.name);
    
    res.json({ 
      success: true, 
      message: 'تم تحديث بيانات العميل بنجاح',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        deviceLockEnabled: user.deviceLockEnabled,
        deviceAccountLimit: user.deviceAccountLimit
      }
    });
    
  } catch (error) {
    console.error('❌ Error editing user:', error);
    res.json({ success: false, message: 'حدث خطأ في تحديث البيانات' });
  }
});

// Delete User
router.post('/users/:id/delete', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log('🗑️ Deleting user:', userId);
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    // Only allow deleting buyers
    if (user.role !== 'buyer') {
      return res.json({ success: false, message: 'لا يمكن حذف المشرفين' });
    }
    
    const userName = user.name;
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    console.log('✅ User deleted successfully:', userName);
    console.log('🔓 Device fingerprint released:', user.deviceFingerprint);
    
    res.json({ 
      success: true, 
      message: `تم حذف العميل "${userName}" بنجاح. يمكن الآن استخدام نفس الجهاز لحساب جديد.`
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.json({ success: false, message: 'حدث خطأ في حذف العميل' });
  }
});

module.exports = router;
