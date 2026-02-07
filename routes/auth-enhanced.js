// [[ARABIC_HEADER]] هذا الملف (routes/auth-enhanced.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// نظام المصادقة المحسّن لـ HM CAR
// - دخول العملاء بالاسم وكلمة المرور
// - تتبع IP والجهاز
// - صلاحيات متقدمة
// - إدارة شاملة في لوحة التحكم

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ClientSession = require('../models/ClientSession');
const { requireAuth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// الحصول على معلومات الجهاز والعميل
const getClientInfo = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  
  return {
    ip: ip,
    userAgent: req.headers['user-agent'] || '',
    deviceFingerprint: req.headers['x-device-fingerprint'] || 
                      req.body.deviceFingerprint || 
                      crypto.createHash('md5').update(ip + req.headers['user-agent']).digest('hex'),
    platform: req.headers['sec-ch-ua-platform'] || 'unknown',
    browser: req.headers['sec-ch-ua'] || 'unknown'
  };
};

// حفظ جلسة العميل
const saveClientSession = async (userId, clientInfo, loginTime = new Date()) => {
  try {
    const session = new ClientSession({
      userId: userId,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      deviceFingerprint: clientInfo.deviceFingerprint,
      platform: clientInfo.platform,
      browser: clientInfo.browser,
      loginTime: loginTime,
      lastActivity: loginTime,
      isActive: true
    });
    
    await session.save();
    return session;
  } catch (error) {
    console.error('Error saving client session:', error);
    return null;
  }
};

// تحديث نشاط الجلسة
const updateSessionActivity = async (sessionId) => {
  try {
    await ClientSession.findByIdAndUpdate(sessionId, {
      lastActivity: new Date()
    });
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
};

// GET /auth/login - صفحة الدخول المحسّنة
router.get('/login', (req, res) => {
  const clientInfo = getClientInfo(req);
  
  res.render('auth/login-enhanced', {
    layout: 'layout',
    hideNavbar: true,
    fullWidth: true,
    bodyClass: 'hm-auth-page',
    clientInfo: clientInfo,
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    error: req.session.flash?.error || null,
    success: req.session.flash?.success || null,
    returnTo: req.session.returnTo || '/dashboard'
  });
  
  req.session.flash = null;
});

// POST /auth/login - معالجة الدخول
router.post('/login', async (req, res) => {
  try {
    const { name, email, password, loginType, rememberMe } = req.body;
    const clientInfo = getClientInfo(req);
    
    console.log('🔐 Enhanced login attempt:', {
      name,
      email,
      loginType,
      clientInfo: {
        ip: clientInfo.ip,
        deviceFingerprint: clientInfo.deviceFingerprint,
        platform: clientInfo.platform
      }
    });

    // تحديد نوع الدخول
    if (loginType === 'admin') {
      return await handleAdminLogin(req, res, email, password, clientInfo);
    } else if (loginType === 'client') {
      return await handleClientLogin(req, res, name, password, clientInfo, rememberMe);
    } else {
      // محاولة تلقائية للتحديد
      if (email && password) {
        return await handleAdminLogin(req, res, email, password, clientInfo);
      } else if (name && password) {
        return await handleClientLogin(req, res, name, password, clientInfo, rememberMe);
      }
    }

    throw new Error('يرجى تحديد نوع الدخول وتعبئة البيانات المطلوبة');

  } catch (error) {
    console.error('Login error:', error);
    req.session.flash = { error: error.message };
    res.redirect('/auth/login');
  }
});

// معالجة دخول الأدمن
async function handleAdminLogin(req, res, email, password, clientInfo) {
  try {
    // البحث عن الأدمن
    const admin = await User.findOne({ 
      email: email.toLowerCase(), 
      role: { $in: ['admin', 'super_admin'] }
    });

    if (!admin) {
      throw new Error('بيانات الأدمن غير صحيحة');
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('بيانات الأدمن غير صحيحة');
    }

    // التحقق من حالة الحساب
    if (admin.status === 'suspended') {
      throw new Error('حساب الأدمن معلق');
    }

    // حفظ جلسة الأدمن
    req.session.user = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      loginType: 'admin'
    };

    // حفظ جلسة العميل
    await saveClientSession(admin._id, clientInfo);

    // تحديث آخر دخول
    admin.lastLogin = new Date();
    admin.lastLoginIP = clientInfo.ip;
    admin.lastLoginDevice = clientInfo.deviceFingerprint;
    await admin.save();

    console.log('✅ Admin login successful:', { email, ip: clientInfo.ip });

    req.session.flash = { success: 'مرحباً بك في لوحة التحكم' };
    res.redirect('/admin');

  } catch (error) {
    throw error;
  }
}

// معالجة دخول العميل
async function handleClientLogin(req, res, name, password, clientInfo, rememberMe) {
  try {
    if (!name || !password) {
      throw new Error('يرجى إدخال الاسم وكلمة المرور');
    }

    // البحث عن العميل بالاسم
    let client = await User.findOne({ 
      name: name.trim(),
      role: 'buyer'
    });

    // إذا لم يكن العميل موجوداً، قم بإنشائه
    if (!client) {
      console.log('🆕 Creating new client:', name);
      
      // التحقق من أن الجهاز غير مرتبط بحسابات كثيرة
      const deviceClients = await User.countDocuments({ 
        deviceFingerprint: clientInfo.deviceFingerprint,
        role: 'buyer'
      });

      if (deviceClients >= 5) { // حد أقصى 5 حسابات للجهاز الواحد
        throw new Error('هذا الجهاز مرتبط بالحد الأقصى من الحسابات. يرجى التواصل مع الإدارة');
      }

      // إنشاء حساب جديد
      const hashedPassword = await bcrypt.hash(password, 10);
      client = new User({
        name: name.trim(),
        email: `client_${Date.now()}@hmcar.local`, // بريد إلكتروني مؤقت
        password: hashedPassword,
        role: 'buyer',
        deviceFingerprint: clientInfo.deviceFingerprint,
        registrationIP: clientInfo.ip,
        registrationDevice: clientInfo.deviceFingerprint,
        permissions: {
          canViewCars: true,
          canViewAuctions: true,
          canPlaceBids: true,
          canViewProfile: true,
          canEditProfile: true
        },
        status: 'active',
        createdBy: 'self'
      });

      await client.save();
      console.log('✅ New client created:', { name, id: client._id });

    } else {
      // التحقق من كلمة المرور للعميل الموجود
      const isPasswordValid = await bcrypt.compare(password, client.password);
      if (!isPasswordValid) {
        throw new Error('كلمة المرور غير صحيحة');
      }

      // تحديث معلومات الجهاز إذا تغيرت
      if (client.deviceFingerprint !== clientInfo.deviceFingerprint) {
        client.deviceFingerprint = clientInfo.deviceFingerprint;
        await client.save();
      }
    }

    // التحقق من حالة الحساب
    if (client.status === 'suspended') {
      throw new Error('حسابك معلق. يرجى التواصل مع الإدارة');
    }

    // حفظ جلسة العميل
    req.session.user = {
      id: client._id,
      name: client.name,
      email: client.email,
      role: client.role,
      permissions: client.permissions || {},
      loginType: 'client'
    };

    // حفظ جلسة العميل
    const session = await saveClientSession(client._id, clientInfo);
    
    // تحديث آخر دخول
    client.lastLogin = new Date();
    client.lastLoginIP = clientInfo.ip;
    client.lastLoginDevice = clientInfo.deviceFingerprint;
    client.loginCount = (client.loginCount || 0) + 1;
    await client.save();

    console.log('✅ Client login successful:', { name, ip: clientInfo.ip });

    req.session.flash = { success: `مرحباً بك ${name}` };
    res.redirect('/client');

  } catch (error) {
    throw error;
  }
}

// GET /auth/register - صفحة التسجيل (للعملاء)
router.get('/register', (req, res) => {
  const clientInfo = getClientInfo(req);
  
  res.render('auth/register-enhanced', {
    layout: 'layout',
    hideNavbar: true,
    fullWidth: true,
    bodyClass: 'hm-auth-page',
    clientInfo: clientInfo,
    csrfToken: req.csrfToken ? req.csrfToken() : ''
  });
});

// POST /auth/register - تسجيل عميل جديد
router.post('/register', async (req, res) => {
  try {
    const { name, password, confirmPassword, phone } = req.body;
    const clientInfo = getClientInfo(req);

    // التحقق من البيانات
    if (!name || !password) {
      throw new Error('يرجى إدخال الاسم وكلمة المرور');
    }

    if (password !== confirmPassword) {
      throw new Error('كلمات المرور غير متطابقة');
    }

    if (password.length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    // التحقق من وجود العميل
    const existingClient = await User.findOne({ 
      name: name.trim(),
      role: 'buyer'
    });

    if (existingClient) {
      throw new Error('هذا الاسم مسجل بالفعل');
    }

    // إنشاء الحساب
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = new User({
      name: name.trim(),
      email: `client_${Date.now()}@hmcar.local`,
      password: hashedPassword,
      phone: phone || '',
      role: 'buyer',
      deviceFingerprint: clientInfo.deviceFingerprint,
      registrationIP: clientInfo.ip,
      registrationDevice: clientInfo.deviceFingerprint,
      permissions: {
        canViewCars: true,
        canViewAuctions: true,
        canPlaceBids: true,
        canViewProfile: true,
        canEditProfile: true
      },
      status: 'active',
      createdBy: 'self',
      loginCount: 0
    });

    await client.save();
    await saveClientSession(client._id, clientInfo);

    // تسجيل الدخول تلقائياً
    req.session.user = {
      id: client._id,
      name: client.name,
      email: client.email,
      role: client.role,
      permissions: client.permissions,
      loginType: 'client'
    };

    console.log('✅ New client registered:', { name, ip: clientInfo.ip });

    req.session.flash = { success: 'تم إنشاء حسابك بنجاح! مرحباً بك' };
    res.redirect('/client');

  } catch (error) {
    console.error('Registration error:', error);
    req.session.flash = { error: error.message };
    res.redirect('/auth/register');
  }
});

// POST /auth/logout - تسجيل الخروج
router.post('/logout', (req, res) => {
  const clientInfo = getClientInfo(req);
  
  if (req.session.user) {
    console.log('👋 User logout:', { 
      userId: req.session.user.id, 
      name: req.session.user.name,
      ip: clientInfo.ip 
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
});

// GET /auth/sessions - عرض الجلسات النشطة (للأدمن)
router.get('/sessions', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const sessions = await ClientSession.find({ isActive: true })
      .populate('userId', 'name email role')
      .sort({ lastActivity: -1 })
      .limit(100);

    res.render('admin/sessions', {
      layout: 'layout',
      bodyClass: 'admin-body',
      hideNavbar: true,
      hideSearch: true,
      fullWidth: true,
      sessions: sessions,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).send('خطأ في تحميل الجلسات');
  }
});

// POST /auth/sessions/:id/terminate - إنهاء جلسة (للأدمن)
router.post('/sessions/:id/terminate', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await ClientSession.findByIdAndUpdate(req.params.id, {
      isActive: false,
      terminatedAt: new Date(),
      terminatedBy: req.session.user.id
    });

    req.session.flash = { success: 'تم إنهاء الجلسة بنجاح' };
    res.redirect('/auth/sessions');
  } catch (error) {
    console.error('Error terminating session:', error);
    req.session.flash = { error: 'فشل في إنهاء الجلسة' };
    res.redirect('/auth/sessions');
  }
});

module.exports = router;
