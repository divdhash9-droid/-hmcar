// [[ARABIC_HEADER]] ┘ç╪░╪º ╪º┘ä┘à┘ä┘ü (routes/auth.js) ╪¼╪▓╪í ┘à┘å ┘à╪┤╪▒┘ê╪╣ HM CAR ┘ê┘è╪¡╪¬┘ê┘è ╪¬╪╣┘ä┘è┘é╪º╪¬ ╪╣╪▒╪¿┘è╪⌐ ┘ä╪╢┘à╪º┘å ╪º┘ä┘ê╪╢┘ê╪¡.

// routes/auth.js
// ┘à╪│╪º╪▒╪º╪¬ ╪º┘ä┘à╪╡╪º╪»┘é╪⌐ (Authentication): ╪¬╪│╪¼┘è┘ä╪î ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä/╪º┘ä╪«╪▒┘ê╪¼
// ╪┤╪▒╪¡ ╪¿╪º┘ä╪╣╪▒╪¿┘è:
// - ┘ç╪░╪º ╪º┘ä┘à┘ä┘ü ┘è╪¬╪╣╪º┘à┘ä ┘à╪╣ ╪╡┘ü╪¡╪º╪¬ ┘ê╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä┘à╪╡╪º╪»┘é╪⌐: ╪╣╪▒╪╢ ╪╡┘ü╪¡╪⌐ ╪º┘ä╪»╪«┘ê┘ä╪î ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ┘ä┘ä┘à╪┤╪¬╪▒┘è ┘ê╪º┘ä╪ú╪»┘à┘å╪î
//   ╪Ñ┘å╪┤╪º╪í ╪¡╪│╪º╪¿ ┘à╪┤╪¬╪▒┘è ╪¿╪│┘è╪╖╪î ┘ê╪º┘ä╪¬┘ê╪¼┘è┘ç ╪¿╪╣╪» ╪º┘ä╪»╪«┘ê┘ä.
// - ┘è╪│╪¬╪«╪»┘à `getLoginViewData` ┘ä╪¬┘ê╪¡┘è╪» ╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä╪╣╪▒╪╢ (layout╪î csrfToken╪î ┘ê╪║┘è╪▒┘ç╪º).
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Firebase completely removed - using local storage only
// const { admin } = require('../config/firebase');

// ╪¿┘è╪º┘å╪º╪¬ ┘à╪┤╪¬╪▒┘â╪⌐ ┘ä╪╡┘ü╪¡╪º╪¬ ╪º┘ä╪╣╪▒╪╢
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

// GET /auth/login - ╪╣╪▒╪╢ ╪╡┘ü╪¡╪⌐ ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä
router.get('/login', (req, res) => {
  console.log('≡ƒöì GET /auth/login accessed');
  console.log('≡ƒôï Current session user:', req.session.user);
  console.log('≡ƒôì Current path:', req.path);
  console.log('≡ƒîÉ Original URL:', req.originalUrl);

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
    console.log('Γ£à User already logged in, redirecting...');
    if (req.session.user.role === 'admin' || req.session.user.role === 'super_admin') {
      console.log('≡ƒæ¿ΓÇì≡ƒÆ╝ Redirecting admin to /admin');
      return res.redirect('/admin');
    } else if (req.session.user.role === 'buyer') {
      console.log('≡ƒ¢Æ Redirecting buyer to /client/dashboard');
      return res.redirect('/client/dashboard');
    }
  }
  
  // Check if admin login requested
  const isAdminLogin = req.query.admin === 'true';
  
  console.log('≡ƒôä Rendering login page, admin mode:', isAdminLogin);
  res.render('auth/login', getLoginViewData(req, isAdminLogin, { bodyClass: 'auth-page modern-auth hm-login-premium' }));
});

// ╪¬┘å┘ü┘è╪░ ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä
router.post('/login', async (req, res) => {
  console.log('≡ƒöæ POST /auth/login accessed');
  console.log('≡ƒôï Request body:', req.body);
  
  // Temporarily disable CSRF validation for login form
  const { name, password, idToken, loginRole, email } = req.body;
  
  try {
    let role = String(loginRole || '').trim();
    const identifier = String(name || email || '').trim(); // ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪«╪»┘à ╪ú┘ê ╪º┘ä╪¿╪▒┘è╪»

    // ╪º╪│╪¬┘å╪¬╪º╪¼ ╪º┘ä╪»┘ê╪▒ ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ╪Ñ╪░╪º ┘ä┘à ┘è╪¬┘à ╪¬╪¡╪»┘è╪»┘ç
    if (!role) {
      if (email || (identifier.includes('@') && password)) {
        role = 'admin';
      } else {
        role = 'buyer';
      }
    }
    
    console.log('≡ƒÄ» Login attempt:', { role, identifier, email, isAdminLogin: req.query.admin === 'true' });

    if (!['buyer', 'admin', 'super_admin'].includes(role)) {
      console.log('Γ¥î Invalid role:', role);
      return res.render('auth/login', getLoginViewData(req, role === 'admin' || role === 'super_admin', { bodyClass: 'auth-page modern-auth hm-login-premium', error: '┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪«╪»┘à ╪║┘è╪▒ ╪╡╪º┘ä╪¡.' }));
    }

    // --- ╪¬╪│╪¼┘è┘ä ╪»╪«┘ê┘ä ╪º┘ä╪╣┘à┘è┘ä (Buyer) ╪¿╪º┘ä╪º╪│┘à ┘ü┘é╪╖ ---
    if (role === 'buyer') {
      if (!identifier) {
        return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '┘è╪▒╪¼┘ë ╪Ñ╪»╪«╪º┘ä ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪«╪»┘à.' }));
      }

      // ╪º┘ä╪¬╪¡┘é┘é ┘à┘å ╪ú┘å ╪º┘ä╪º╪│┘à ┘è╪¡╪¬┘ê┘è ╪╣┘ä┘ë ╪º╪│┘à┘è┘å ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä (╪º╪│┘à ┘ê┘ä┘é╪¿)
      const nameParts = identifier.split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '╪º┘ä╪º╪│┘à ┘è╪¼╪¿ ╪ú┘å ┘è╪¬┘â┘ê┘å ┘à┘å ╪º╪│┘à┘è┘å ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä.' }));
      }

      // ╪º┘ä╪¿╪¡╪½ ╪╣┘å ╪º┘ä┘à╪│╪¬╪«╪»┘à ╪¿╪º┘ä╪º╪│┘à (┘à┘ü╪¬╪º╪¡ ╪º╪│┘à ╪º┘ä┘à╪┤╪¬╪▒┘è)
      let user = await User.findOne({ buyerNameKey: identifier.toLowerCase() });

      // ╪Ñ╪░╪º ┘ä┘à ┘è┘â┘å ┘à┘ê╪¼┘ê╪»┘ï╪º╪î ┘å┘å╪┤╪ª ╪¡╪│╪º╪¿ ┘à╪┤╪¬╪▒┘è ╪¼╪»┘è╪» ╪¬┘ä┘é╪º╪ª┘è╪º┘ï
      if (!user) {
        user = await User.create({
          name: identifier,
          buyerNameKey: identifier.toLowerCase(),
          role: 'buyer',
          lastLoginAt: new Date(),
          activeSessionId: req.sessionID
        });
      } else {
        // ╪¬╪ú┘â┘è╪» ╪º┘ä╪»┘ê╪▒ ┘ê╪¬╪¡╪»┘è╪½ ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪¼┘ä╪│╪⌐
        if (user.role !== 'buyer') {
          return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '╪¡╪│╪º╪¿ ╪║┘è╪▒ ╪╡╪º┘ä╪¡ ┘ä┘ä╪»╪«┘ê┘ä ┘â┘à╪┤╪¬╪▒┘è.' }));
        }
        
        // ╪º┘ä╪¬╪¡┘é┘é ┘à┘å ╪▒╪¿╪╖ ╪º┘ä╪¼┘ç╪º╪▓ (Device Binding)
        if (!user.allowMultipleSessions && user.deviceId && user.deviceId !== req.sessionID) {
          // ╪º┘ä╪¬╪¡┘é┘é ┘à┘à╪º ╪Ñ╪░╪º ┘â╪º┘å ╪º┘ä╪¼┘ç╪º╪▓ ┘à╪▒╪¬╪¿╪╖┘ï╪º ┘à╪│╪¿┘é┘ï╪º
          const isKnownDevice = user.boundDevices.some(device => 
            device.deviceId === req.sessionID || 
            device.ip === req.ip
          );
          
          if (!isKnownDevice) {
            return res.render('auth/login', getLoginViewData(req, false, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '╪¬┘à ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ╪Ñ┘ä┘ë ┘ç╪░╪º ╪º┘ä╪¡╪│╪º╪¿ ┘à┘å ╪¼┘ç╪º╪▓ ╪ó╪«╪▒. ┘è╪▒╪¼┘ë ╪º┘ä╪º╪¬╪╡╪º┘ä ╪¿╪º┘ä╪»╪╣┘à ┘ä┘ä┘à╪│╪º╪╣╪»╪⌐.' }));
          }
        }
        
        // ╪¬╪¡╪»┘è╪½ ┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪¼┘ç╪º╪▓
        user.activeSessionId = req.sessionID;
        user.lastLoginAt = new Date();
        
        // ╪¬╪¡╪»┘è╪½ ┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪¼┘ç╪º╪▓
        const deviceInfo = {
          browser: req.get('User-Agent') || '',
          os: req.get('User-Agent') || '',
          userAgent: req.get('User-Agent') || '',
          ip: req.ip || req.connection.remoteAddress || '',
          lastUsedAt: new Date()
        };
        
        user.deviceInfo = deviceInfo;
        
        // ╪Ñ╪╢╪º┘ü╪⌐ ╪º┘ä╪¼┘ç╪º╪▓ ╪Ñ┘ä┘ë ┘é╪º╪ª┘à╪⌐ ╪º┘ä╪ú╪¼┘ç╪▓╪⌐ ╪º┘ä┘à╪▒╪¬╪¿╪╖╪⌐
        const existingDeviceIndex = user.boundDevices.findIndex(device => 
          device.deviceId === req.sessionID || device.ip === deviceInfo.ip
        );
        
        if (existingDeviceIndex === -1) {
          // ╪Ñ╪╢╪º┘ü╪⌐ ╪¼┘ç╪º╪▓ ╪¼╪»┘è╪»
          user.boundDevices.push({
            deviceId: req.sessionID,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip: deviceInfo.ip,
            firstUsedAt: new Date(),
            lastUsedAt: new Date()
          });
        } else {
          // ╪¬╪¡╪»┘è╪½ ┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪¼┘ç╪º╪▓ ╪º┘ä┘à┘ê╪¼┘ê╪»
          user.boundDevices[existingDeviceIndex].lastUsedAt = new Date();
        }
        
        await user.save();
      }

      req.session.user = { _id: user._id, name: user.name, role: user.role };
      req.session.flash = { type: 'success', message: `┘à╪▒╪¡╪¿╪º┘ï ${user.name}╪î ╪¬┘à ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ╪¿╪º╪│┘à ╪º┘ä┘à╪│╪¬╪«╪»┘à.` };

      // Handle remember me
      if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      const returnTo = (req.session && req.session.returnTo) ? String(req.session.returnTo) : '/client/dashboard';
      delete req.session.returnTo;
      return res.redirect(returnTo);
    }

    // --- ╪¬╪│╪¼┘è┘ä ╪»╪«┘ê┘ä ╪º┘ä╪ú╪»┘à┘å (Admin) ---
    if (role === 'admin' || role === 'super_admin') {
      console.log('≡ƒöÉ Admin login attempt for:', email);
      
      // 1) ╪º┘ä╪¬╪¡┘é┘é ╪╣╪¿╪▒ Firebase Token (╪Ñ╪░╪º ╪¬┘à ╪Ñ╪▒╪│╪º┘ä┘ç)
      if (idToken) {
        // Firebase code here...
      }

      // 2) ╪¿╪»┘è┘ä: ╪¬╪│╪¼┘è┘ä ╪»╪«┘ê┘ä ╪¿╪º┘ä╪ú┘è┘à┘è┘ä ┘ê┘â┘ä┘à╪⌐ ╪º┘ä┘à╪▒┘ê╪▒ (┘à┘ü┘è╪» ╪╣┘å╪»┘à╪º ┘ä╪º ┘è╪¬┘à ╪º╪│╪¬╪«╪»╪º┘à ╪╣┘à┘è┘ä Firebase)
      const suppliedPassword = String(password || '').trim();
      const suppliedEmail = String(identifier || '').trim().toLowerCase();

      if (!suppliedEmail || !suppliedPassword) {
        return res.render('auth/login', getLoginViewData(req, true, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '┘è╪▒╪¼┘ë ╪Ñ╪»╪«╪º┘ä ╪º┘ä╪¿╪▒┘è╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ┘ê┘â┘ä┘à╪⌐ ╪º┘ä┘à╪▒┘ê╪▒ ┘ä┘ä╪ú╪»┘à┘å.' }));
      }

      const adminUser = await User.findOne({ email: suppliedEmail, role: { $in: ['admin', 'super_admin'] } });
      if (!adminUser) {
        return res.render('auth/login', getLoginViewData(req, true, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪º╪╣╪¬┘à╪º╪» ╪║┘è╪▒ ╪╡╪¡┘è╪¡╪⌐ ╪ú┘ê ╪¡╪│╪º╪¿ ╪º┘ä╪ú╪»┘à┘å ╪║┘è╪▒ ┘à┘ê╪¼┘ê╪».' }));
      }

      const passwordMatch = await adminUser.comparePassword(suppliedPassword);
      if (!passwordMatch) {
        return res.render('auth/login', getLoginViewData(req, true, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪º╪╣╪¬┘à╪º╪» ╪║┘è╪▒ ╪╡╪¡┘è╪¡╪⌐.' }));
      }

      // ╪¬┘à ╪¬╪╣╪╖┘è┘ä ╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪Ñ╪╢╪º┘ü┘è ╪╣╪¿╪▒ Firebase ┘à╪ñ┘é╪¬╪º┘ï ┘ä┘ä╪│┘à╪º╪¡ ╪¿╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ╪º┘ä┘à╪¡┘ä┘è ┘ä┘ä┘à╪│╪ñ┘ê┘ä┘è┘å.
      // ╪│╪¬╪¬┘à ╪Ñ╪╣╪º╪»╪⌐ ╪¬┘ü╪╣┘è┘ä ┘ç╪░╪º ╪º┘ä╪¬╪¡┘é┘é ╪╣┘å╪» ╪Ñ╪╣╪º╪»╪⌐ ╪¬┘ü╪╣┘è┘ä Firebase.

      // ╪¿╪╣╪» ╪¬╪╣╪╖┘è┘ä Firebase╪î ╪│┘å╪╣╪¬╪¿╪▒ ╪º┘ä┘à╪│╪¬╪«╪»┘à ╪╡╪º┘ä╪¡╪º┘ï ╪Ñ╪░╪º ╪¬┘à ╪º┘ä╪╣╪½┘ê╪▒ ╪╣┘ä┘è┘ç ┘ü┘è MongoDB ┘ê┘â┘ä┘à╪⌐ ╪º┘ä┘à╪▒┘ê╪▒ ╪╡╪¡┘è╪¡╪⌐.
      // ┘ç┘å╪º ┘â╪º┘å ┘è┘ê╪¼╪» ┘â┘ê╪» ┘ä╪╢╪¿╪╖ firebaseUid ┘ü┘è ╪º┘ä╪│╪¼┘ä ╪º┘ä┘à╪¡┘ä┘è ╪Ñ╪░╪º ┘ä┘à ┘è┘â┘å ┘à┘ê╪¼┘ê╪»╪º┘ï.
      // ╪¿┘à╪º ╪ú┘å Firebase ┘à╪╣╪╖┘ä╪î ┘ä┘å ┘å┘ü╪╣┘ä ╪┤┘è╪ª╪º┘ï ┘ç┘å╪º ╪¡╪º┘ä┘è╪º┘ï.

      // ┘å╪¼╪º╪¡ ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ΓÇö ╪¡╪»┘æ╪½ ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪¼┘ä╪│╪⌐
      adminUser.activeSessionId = req.sessionID;
      adminUser.lastLoginAt = new Date();
      await adminUser.save();

      req.session.user = { _id: adminUser._id, name: adminUser.name, role: adminUser.role, email: adminUser.email };
      req.session.flash = { type: 'success', message: `┘à╪▒╪¡╪¿╪º┘ï ╪ú┘è┘ç╪º ╪º┘ä╪ú╪»┘à┘å ${adminUser.name}` };
      
      // Handle remember me
      if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      console.log('Γ£à Admin login successful:', {
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        sessionId: req.sessionID
      });
      
      console.log('≡ƒôï Session after login:', req.session);
      console.log('≡ƒôï Session user after login:', req.session.user);
      
      const desired = (req.session && req.session.returnTo) ? String(req.session.returnTo) : '';
      const returnTo2 = (desired && desired.startsWith('/admin') && !desired.startsWith('//')) ? desired : '/admin';
      delete req.session.returnTo;
      
      console.log('≡ƒöä Redirecting to:', returnTo2);
      console.log('≡ƒôï Session returnTo was:', req.session.returnTo);
      console.log('≡ƒôì Original URL was:', req.originalUrl);
      
      return res.redirect(returnTo2);
    }

  } catch (e) {
    console.error('Auth login error:', e);
    const isAdm = req.body.loginRole === 'admin' || !!(req.body.email && req.body.password);
    res.render('auth/login', getLoginViewData(req, isAdm, { bodyClass: 'auth-page modern-auth hm-login-premium', error: '╪«╪╖╪ú ┘ü┘è ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä' }));
  }
});

// ╪╣╪▒╪╢ ╪╡┘ü╪¡╪⌐ ╪Ñ┘å╪┤╪º╪í ╪¡╪│╪º╪¿ ╪¼╪»┘è╪»
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/cars');
  res.render('auth/register', getLoginViewData(req, false));
});

// ╪¬┘å┘ü┘è╪░ ╪Ñ┘å╪┤╪º╪í ╪¡╪│╪º╪¿ ╪¼╪»┘è╪»
router.post('/register', async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim().toLowerCase();
    
  const renderError = (error) => res.render('auth/register', getLoginViewData(req, false, { error }));

  if (!trimmedName || !password || !passwordConfirm) {
    return renderError('┘è╪▒╪¼┘ë ┘à┘ä╪í ╪¼┘à┘è╪╣ ╪º┘ä╪¡┘é┘ê┘ä ╪º┘ä╪Ñ┘ä╪▓╪º┘à┘è╪⌐.');
  }
  if (password !== passwordConfirm) {
    return renderError('┘â┘ä┘à╪¬╪º ╪º┘ä┘à╪▒┘ê╪▒ ╪║┘è╪▒ ┘à╪¬╪╖╪º╪¿┘é╪¬┘è┘å.');
  }
  if (password.length < 6) {
    return renderError('┘è╪¼╪¿ ╪ú┘å ╪¬┘â┘ê┘å ┘â┘ä┘à╪⌐ ╪º┘ä┘à╪▒┘ê╪▒ 6 ╪ú╪¡╪▒┘ü ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä.');
  }

  try {
    const buyerNameKey = trimmedName.toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ buyerNameKey }, { email: trimmedEmail }]
    });

    if (existingUser) {
      return renderError('╪º┘ä╪º╪│┘à ╪ú┘ê ╪º┘ä╪¿╪▒┘è╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ┘à╪│╪¼┘ä ┘à╪│╪¿┘é╪º┘ï.');
    }

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      buyerNameKey,
      password, // ╪│┘è╪¬┘à ╪╣┘à┘ä hash ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ╪¿┘ü╪╢┘ä ╪º┘ä┘Ç pre-save hook ┘ü┘è ╪º┘ä┘à┘ê╪»┘è┘ä
      role: 'buyer',
      lastLoginAt: new Date()
    });

    // Send notification to admins about new user
    const NotificationService = require('../services/NotificationService');
    await NotificationService.sendNewUserNotification(user);

    // ╪¬╪│╪¼┘è┘ä ╪»╪«┘ê┘ä ╪º┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¼╪»┘è╪» ┘à╪¿╪º╪┤╪▒╪⌐
    req.session.user = { _id: user._id, name: user.name, role: user.role };
    req.session.flash = { type: 'success', message: '╪¬┘à ╪Ñ┘å╪┤╪º╪í ╪¡╪│╪º╪¿┘â ╪¿┘å╪¼╪º╪¡! ┘à╪▒╪¡╪¿╪º┘ï ╪¿┘â.' };
    const returnTo = (req.session && req.session.returnTo) ? String(req.session.returnTo) : '/client/dashboard';
    delete req.session.returnTo;
    res.redirect(returnTo);

  } catch (e) {
    console.error('Registration Error:', e);
    renderError('╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪Ñ┘å╪┤╪º╪í ╪º┘ä╪¡╪│╪º╪¿. ┘è╪▒╪¼┘ë ╪º┘ä┘à╪¡╪º┘ê┘ä╪⌐ ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë.');
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
      // ╪Ñ╪▓╪º┘ä╪⌐ session ID ┘à┘å ╪│╪¼┘ä ╪º┘ä┘à╪│╪¬╪«╪»┘à ┘ä┘à┘å╪╣ ┘à╪┤╪º┘â┘ä ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ┘à╪│╪¬┘é╪¿┘ä╪º┘ï
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
