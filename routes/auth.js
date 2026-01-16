﻿// routes/auth.js
// مسارات المصادقة (Authentication): تسجيل، تسجيل الدخول/الخروج
// شرح بالعربي:
// - هذا الملف يتعامل مع صفحات وعمليات المصادقة: عرض صفحة الدخول، تسجيل الدخول للمشتري والأدمن،
//   إنشاء حساب مشتري بسيط، والتوجيه بعد الدخول.
// - يستخدم `getLoginViewData` لتوحيد إعدادات العرض (layout، csrfToken، وغيرها).
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Firebase completely removed - using local storage only
// const { admin } = require('../config/firebase');

// بيانات مشتركة لصفحات العرض
const getLoginViewData = (req, isAdminLogin = false, additionalData = {}) => {
  return {
    layout: 'layout',
    hideNavbar: true,
    fullWidth: true,
    buyerFullWidth: true,
    bodyClass: 'hm-login-page',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    isAdminLogin: isAdminLogin,
    returnTo: (req.session && req.session.returnTo) ? String(req.session.returnTo) : '',
    ...additionalData
  };
};

// GET /auth/login - عرض صفحة تسجيل الدخول
router.get('/login', (req, res) => {
  console.log('🔍 GET /auth/login accessed');
  console.log('📋 Current session user:', req.session.user);
  console.log('📍 Current path:', req.path);
  console.log('🌐 Original URL:', req.originalUrl);

  if (req.session && req.session.returnTo) {
    const candidate = String(req.session.returnTo);
    if (candidate.startsWith('/api') || candidate.startsWith('/socket.io')) {
      delete req.session.returnTo;
    }
  }

  // Allow setting a post-login destination from the login page
  // (used by homepage CTAs). Only allow local absolute paths.
  if (req.query && typeof req.query.returnTo !== 'undefined') {
    const candidate = String(req.query.returnTo || '').trim();
    const isLocalAbsolutePath = candidate.startsWith('/') && !candidate.startsWith('//');
    const isSafe = isLocalAbsolutePath && !candidate.startsWith('/api') && !candidate.startsWith('/socket.io');
    if (isSafe) {
      req.session.returnTo = candidate;
    }
  }
  
  // If user is already logged in, redirect based on role
  if (req.session.user) {
    console.log('✅ User already logged in, redirecting...');
    if (req.session.user.role === 'admin' || req.session.user.role === 'super_admin') {
      console.log('👨‍💼 Redirecting admin to /admin');
      return res.redirect('/admin');
    } else if (req.session.user.role === 'buyer') {
      console.log('🛒 Redirecting buyer to /cars');
      return res.redirect('/cars');
    }
  }
  
  // Check if admin login requested
  const isAdminLogin = req.query.admin === 'true';
  
  console.log('📄 Rendering login page, admin mode:', isAdminLogin);
  res.render('auth/login', getLoginViewData(req, isAdminLogin, { bodyClass: 'auth-page modern-auth hm-login-premium' }));
});

// تنفيذ تسجيل الدخول
router.post('/login', async (req, res) => {
  console.log('🔑 POST /auth/login accessed');
  console.log('📋 Request body:', req.body);
  
  // Temporarily disable CSRF validation for login form
  const { name, password, idToken, loginRole, email } = req.body;
  
  try {
    let role = String(loginRole || '').trim();
    const identifier = String(name || email || '').trim(); // اسم المستخدم أو البريد

    // استنتاج الدور تلقائياً إذا لم يتم تحديده
    if (!role) {
      if (email || (identifier.includes('@') && password)) {
        role = 'admin';
      } else {
        role = 'buyer';
      }
    }
    
    console.log('🎯 Login attempt:', { role, identifier, email, isAdminLogin: req.query.admin === 'true' });

    if (!['buyer', 'admin', 'super_admin'].includes(role)) {
      console.log('❌ Invalid role:', role);
      return res.render('auth/login', getLoginViewData(req, role === 'admin' || role === 'super_admin', { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'نوع المستخدم غير صالح.' }));
    }

    // --- تسجيل دخول العميل (Buyer) بالاسم فقط ---
    if (role === 'buyer') {
      if (!identifier) {
        return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'يرجى إدخال اسم المستخدم.' }));
      }

      // التحقق من أن الاسم يحتوي على اسمين على الأقل (اسم ولقب)
      const nameParts = identifier.split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'الاسم يجب أن يتكون من اسمين على الأقل.' }));
      }

      // البحث عن المستخدم بالاسم (مفتاح اسم المشتري)
      let user = await User.findOne({ buyerNameKey: identifier.toLowerCase() });

      // إذا لم يكن موجودًا، ننشئ حساب مشتري جديد تلقائياً
      if (!user) {
        user = await User.create({
          name: identifier,
          buyerNameKey: identifier.toLowerCase(),
          role: 'buyer',
          lastLoginAt: new Date(),
          activeSessionId: req.sessionID
        });
      } else {
        // تأكيد الدور وتحديث بيانات الجلسة
        if (user.role !== 'buyer') {
          return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'حساب غير صالح للدخول كمشتري.' }));
        }
        user.activeSessionId = req.sessionID;
        user.lastLoginAt = new Date();
        await user.save();
      }

      req.session.user = { _id: user._id, name: user.name, role: user.role };
      req.session.flash = { type: 'success', message: `مرحباً ${user.name}، تم تسجيل الدخول باسم المستخدم.` };

      // Handle remember me
      if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      const returnTo = (req.session && req.session.returnTo) ? String(req.session.returnTo) : '/cars';
      delete req.session.returnTo;
      return res.redirect(returnTo);
    }

    // --- تسجيل دخول الأدمن (Admin) ---
    if (role === 'admin' || role === 'super_admin') {
      console.log('🔐 Admin login attempt for:', email);
      
      // 1) التحقق عبر Firebase Token (إذا تم إرساله)
      if (idToken) {
        // Firebase code here...
      }

      // 2) بديل: تسجيل دخول بالأيميل وكلمة المرور (مفيد عندما لا يتم استخدام عميل Firebase)
      const suppliedPassword = String(password || '').trim();
      const suppliedEmail = String(identifier || '').trim().toLowerCase();

      if (!suppliedEmail || !suppliedPassword) {
        return res.render('auth/login', getLoginViewData(req, true, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور للأدمن.' }));
      }

      const adminUser = await User.findOne({ email: suppliedEmail, role: { $in: ['admin', 'super_admin'] } });
      if (!adminUser) {
        return res.render('auth/login', getLoginViewData(req, true, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'بيانات الاعتماد غير صحيحة أو حساب الأدمن غير موجود.' }));
      }

      const passwordMatch = await adminUser.comparePassword(suppliedPassword);
      if (!passwordMatch) {
        return res.render('auth/login', getLoginViewData(req, true, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'بيانات الاعتماد غير صحيحة.' }));
      }

      // تم تعطيل التحقق الإضافي عبر Firebase مؤقتاً للسماح بتسجيل الدخول المحلي للمسؤولين.
      // ستتم إعادة تفعيل هذا التحقق عند إعادة تفعيل Firebase.

      // بعد تعطيل Firebase، سنعتبر المستخدم صالحاً إذا تم العثور عليه في MongoDB وكلمة المرور صحيحة.
      // هنا كان يوجد كود لضبط firebaseUid في السجل المحلي إذا لم يكن موجوداً.
      // بما أن Firebase معطل، لن نفعل شيئاً هنا حالياً.

      // نجاح تسجيل الدخول — حدّث بيانات الجلسة
      adminUser.activeSessionId = req.sessionID;
      adminUser.lastLoginAt = new Date();
      await adminUser.save();

      req.session.user = { _id: adminUser._id, name: adminUser.name, role: adminUser.role, email: adminUser.email };
      req.session.flash = { type: 'success', message: `مرحباً أيها الأدمن ${adminUser.name}` };
      
      // Handle remember me
      if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      console.log('✅ Admin login successful:', {
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        sessionId: req.sessionID
      });
      
      console.log('📋 Session after login:', req.session);
      console.log('📋 Session user after login:', req.session.user);
      
      const desired = (req.session && req.session.returnTo) ? String(req.session.returnTo) : '';
      const returnTo2 = (desired && desired.startsWith('/admin') && !desired.startsWith('//')) ? desired : '/admin';
      delete req.session.returnTo;
      
      console.log('🔄 Redirecting to:', returnTo2);
      console.log('📋 Session returnTo was:', req.session.returnTo);
      console.log('📍 Original URL was:', req.originalUrl);
      
      return res.redirect(returnTo2);
    }

  } catch (e) {
    console.error('Auth login error:', e);
    const isAdm = req.body.loginRole === 'admin' || !!(req.body.email && req.body.password);
    res.render('auth/login', getLoginViewData(req, isAdm, { bodyClass: 'auth-page modern-auth hm-login-premium', error: 'خطأ في تسجيل الدخول' }));
  }
});

// عرض صفحة إنشاء حساب جديد
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/cars');
  res.render('auth/register', getLoginViewData(req, false));
});

// تنفيذ إنشاء حساب جديد
router.post('/register', async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim().toLowerCase();
    
  const renderError = (error) => res.render('auth/register', getLoginViewData(req, false, { error }));

  if (!trimmedName || !password || !passwordConfirm) {
    return renderError('يرجى ملء جميع الحقول الإلزامية.');
  }
  if (password !== passwordConfirm) {
    return renderError('كلمتا المرور غير متطابقتين.');
  }
  if (password.length < 6) {
    return renderError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
  }

  try {
    const buyerNameKey = trimmedName.toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ buyerNameKey }, { email: trimmedEmail }]
    });

    if (existingUser) {
      return renderError('الاسم أو البريد الإلكتروني مسجل مسبقاً.');
    }

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      buyerNameKey,
      password, // سيتم عمل hash تلقائياً بفضل الـ pre-save hook في الموديل
      role: 'buyer',
      lastLoginAt: new Date()
    });

    // Send notification to admins about new user
    const NotificationService = require('../services/NotificationService');
    await NotificationService.sendNewUserNotification(user);

    // تسجيل دخول المستخدم الجديد مباشرة
    req.session.user = { _id: user._id, name: user.name, role: user.role };
    req.session.flash = { type: 'success', message: 'تم إنشاء حسابك بنجاح! مرحباً بك.' };
    const returnTo = (req.session && req.session.returnTo) ? String(req.session.returnTo) : '/cars';
    delete req.session.returnTo;
    res.redirect(returnTo);

  } catch (e) {
    console.error('Registration Error:', e);
    renderError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
  }
});


router.get('/logout', (req, res) => {
  const currentUser = req.session.user;
  req.session.destroy(async (err) => {
    if (err) {
        console.error('Logout error:', err);
        return res.redirect('/');
    }
    try {
      // إزالة session ID من سجل المستخدم لمنع مشاكل تسجيل الدخول مستقبلاً
      if (currentUser) {
        await User.findByIdAndUpdate(currentUser._id, { activeSessionId: '' });
      }
    } catch (e) {
        console.error('Error clearing activeSessionId on logout:', e);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
