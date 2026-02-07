// [[ARABIC_HEADER]] هذا الملف (routes/admin-clients.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ClientSession = require('../models/ClientSession');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /admin/clients - عرض جميع العملاء
router.get('/', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const clients = await User.find({ role: 'buyer' })
      .sort({ createdAt: -1 })
      .select('name email status lastLogin lastLoginIP deviceFingerprint deviceLockEnabled deviceAccountLimit permissions loginCount createdAt')
      .lean();

    res.render('admin/client-permissions', {
      layout: 'layout',
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      clients: clients,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).send('خطأ في تحميل العملاء');
  }
});

// POST /admin/clients/:id/permissions - تحديث صلاحيات العميل
router.post('/:id/permissions', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { permissions, deviceSettings } = req.body;
    const clientId = req.params.id;

    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    // تحديث الصلاحيات
    if (permissions) {
      client.permissions = {
        ...client.permissions,
        ...permissions
      };
    }

    // تحديث إعدادات الجهاز
    if (deviceSettings) {
      client.deviceLockEnabled = deviceSettings.deviceLockEnabled;
      client.deviceAccountLimit = deviceSettings.deviceAccountLimit;
    }

    await client.save();

    console.log('✅ Client permissions updated:', {
      clientId: clientId,
      clientName: client.name,
      updatedBy: req.session.user.name
    });

    res.json({ success: true, message: 'تم تحديث الصلاحيات بنجاح' });
  } catch (error) {
    console.error('Error updating client permissions:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الصلاحيات' });
  }
});

// POST /admin/clients/global-permissions - تحديث الصلاحيات العامة لجميع العملاء
router.post('/global-permissions', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { permission, value } = req.body;

    // تحديث الصلاحية لجميع العملاء النشطين
    await User.updateMany(
      { role: 'buyer', status: 'active' },
      { [`permissions.${permission}`]: value }
    );

    console.log('✅ Global permission updated:', {
      permission: permission,
      value: value,
      updatedBy: req.session.user.name
    });

    res.json({ success: true, message: 'تم تحديث الصلاحية العامة بنجاح' });
  } catch (error) {
    console.error('Error updating global permissions:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الصلاحيات العامة' });
  }
});

// POST /admin/clients/:id/suspend - تعليق العميل
router.post('/:id/suspend', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    client.status = 'suspended';
    await client.save();

    // إنهاء جميع الجلسات النشطة للعميل
    await ClientSession.updateMany(
      { userId: client._id, isActive: true },
      { isActive: false, terminatedAt: new Date(), terminatedBy: req.session.user.id }
    );

    console.log('🚫 Client suspended:', {
      clientId: client._id,
      clientName: client.name,
      suspendedBy: req.session.user.name
    });

    res.json({ success: true, message: 'تم تعليق العميل بنجاح' });
  } catch (error) {
    console.error('Error suspending client:', error);
    res.status(500).json({ success: false, message: 'خطأ في تعليق العميل' });
  }
});

// POST /admin/clients/:id/activate - تفعيل العميل
router.post('/:id/activate', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    client.status = 'active';
    await client.save();

    console.log('✅ Client activated:', {
      clientId: client._id,
      clientName: client.name,
      activatedBy: req.session.user.name
    });

    res.json({ success: true, message: 'تم تفعيل العميل بنجاح' });
  } catch (error) {
    console.error('Error activating client:', error);
    res.status(500).json({ success: false, message: 'خطأ في تفعيل العميل' });
  }
});

// GET /admin/clients/:id - عرض تفاصيل العميل
// GET /admin/clients/sessions - عرض جميع الجلسات النشطة
// NOTE: must be declared before '/:id' to avoid being captured as an id.
router.get('/sessions', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const sessions = await ClientSession.find({ isActive: true })
      .populate('userId', 'name email role status')
      .sort({ lastActivity: -1 })
      .limit(100);

    res.render('admin/sessions', {
      layout: 'layout',
      sessions: sessions,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).send('خطأ في تحميل الجلسات');
  }
});

// POST /admin/clients/bulk-action - إجراء جماعي على العملاء
// NOTE: must be declared before '/:id' to avoid being captured as an id.
router.post('/bulk-action', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { action, clientIds, permissions } = req.body;

    if (!clientIds || !Array.isArray(clientIds)) {
      return res.status(400).json({ success: false, message: 'يجب تحديد العملاء' });
    }

    let updateData = {};

    switch (action) {
      case 'suspend':
        updateData = { status: 'suspended' };
        break;
      case 'activate':
        updateData = { status: 'active' };
        break;
      case 'update_permissions':
        if (permissions) {
          Object.keys(permissions).forEach(key => {
            updateData[`permissions.${key}`] = permissions[key];
          });
        }
        break;
      case 'reset_devices':
        updateData = { deviceFingerprint: null, deviceLockEnabled: false };
        break;
      default:
        return res.status(400).json({ success: false, message: 'إجراء غير صالح' });
    }

    const result = await User.updateMany(
      { _id: { $in: clientIds }, role: 'buyer' },
      updateData
    );

    console.log('📊 Bulk action completed:', {
      action: action,
      clientIds: clientIds,
      updatedCount: result.modifiedCount,
      updatedBy: req.session.user.name
    });

    res.json({ 
      success: true, 
      message: `تم تنفيذ الإجراء على ${result.modifiedCount} عميل`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ success: false, message: 'خطأ في تنفيذ الإجراء الجماعي' });
  }
});

// GET /admin/clients/:id - عرض تفاصيل العميل
router.get('/:id', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const client = await User.findById(req.params.id)
      .populate('sessions');

    if (!client) {
      return res.status(404).send('العميل غير موجود');
    }

    // الحصول على جلسات العميل
    const sessions = await ClientSession.find({ userId: client._id })
      .sort({ lastActivity: -1 })
      .limit(10);

    res.render('admin/client-details', {
      layout: 'layout',
      client: client,
      sessions: sessions,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).send('خطأ في تحميل تفاصيل العميل');
  }
});

// POST /admin/clients/:id/sessions/:sessionId/terminate - إنهاء جلسة العميل
router.post('/:id/sessions/:sessionId/terminate', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await ClientSession.findByIdAndUpdate(req.params.sessionId, {
      isActive: false,
      terminatedAt: new Date(),
      terminatedBy: req.session.user.id
    });

    req.session.flash = { success: 'تم إنهاء الجلسة بنجاح' };
    res.redirect(`/admin/clients/${req.params.id}`);
  } catch (error) {
    console.error('Error terminating session:', error);
    req.session.flash = { error: 'فشل في إنهاء الجلسة' };
    res.redirect(`/admin/clients/${req.params.id}`);
  }
});

// POST /admin/clients/:id/reset-device - إعادة تعيين جهاز العميل
router.post('/:id/reset-device', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    // إنهاء جميع الجلسات النشطة
    await ClientSession.updateMany(
      { userId: client._id, isActive: true },
      { isActive: false, terminatedAt: new Date(), terminatedBy: req.session.user.id }
    );

    // إعادة تعيين بصمة الجهاز
    client.deviceFingerprint = null;
    client.deviceLockEnabled = false;
    await client.save();

    console.log('🔄 Client device reset:', {
      clientId: client._id,
      clientName: client.name,
      resetBy: req.session.user.name
    });

    res.json({ success: true, message: 'تم إعادة تعيين الجهاز بنجاح' });
  } catch (error) {
    console.error('Error resetting client device:', error);
    res.status(500).json({ success: false, message: 'خطأ في إعادة تعيين الجهاز' });
  }
});

module.exports = router;
