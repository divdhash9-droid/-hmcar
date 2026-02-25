// [[ARABIC_HEADER]] هذا الملف (modules/auth/auth-service.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[ملف خدمة المصادقة]] - modules/auth/auth-service.js
 * 
 * هذا الملف يحتوي على جميع خدمات المصادقة
 * - تسجيل الدخول
 * - تسجيل الخروج
 * - التحقق من المستخدمين
 * - إدارة الجلسات
 * - بصمة الجهاز
 * 
 * @author HM CAR Team
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../../models/User');
const ClientSession = require('../../models/ClientSession');
const logger = require('../core/logger');

/**
 * فئة خدمة المصادقة
 */
class AuthService {
  constructor() {
    this.saltRounds = 10;
  }

  /**
   * تشفير كلمة المرور
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      logger.error('فشل في تشفير كلمة المرور', error);
      throw new Error('فشل في تشفير كلمة المرور');
    }
  }

  /**
   * التحقق من كلمة المرور
   */
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('فشل في التحقق من كلمة المرور', error);
      throw new Error('فشل في التحقق من كلمة المرور');
    }
  }

  /**
   * الحصول على معلومات الجهاز والعميل
   */
  getClientInfo(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    
    return {
      ip: ip,
      userAgent: req.headers['user-agent'] || '',
      deviceFingerprint: req.body.deviceFingerprint || 
                        req.headers['x-device-fingerprint'] || 
                        this.generateDeviceFingerprint(ip, req.headers['user-agent']),
      platform: req.headers['sec-ch-ua-platform'] || 'unknown',
      browser: req.headers['sec-ch-ua'] || 'unknown'
    };
  }

  /**
   * توليد بصمة الجهاز
   */
  generateDeviceFingerprint(ip, userAgent) {
    const data = `${ip}|${userAgent}|${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * تسجيل دخول الأدمن
   */
  async adminLogin(email, password, clientInfo) {
    try {
      logger.info(`محاولة دخول الأدمن: ${email}`, { ip: clientInfo.ip });

      // البحث عن الأدمن
      const admin = await User.findOne({ 
        email: email.toLowerCase(), 
        role: { $in: ['admin', 'super_admin'] }
      });

      if (!admin) {
        logger.security('محاولة دخول أدمن غير موجود', null, clientInfo.ip, { email });
        throw new Error('بيانات الأدمن غير صحيحة');
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await this.verifyPassword(password, admin.password);
      if (!isPasswordValid) {
        logger.security('محاولة دخول بكلمة مرور خاطئة', admin._id, clientInfo.ip);
        throw new Error('بيانات الأدمن غير صحيحة');
      }

      // التحقق من حالة الحساب
      if (admin.status === 'suspended') {
        logger.security('محاولة دخول بحساب معلق', admin._id, clientInfo.ip);
        throw new Error('حساب الأدمن معلق');
      }

      // تحديث معلومات الأدمن
      admin.lastLogin = new Date();
      admin.lastLoginIP = clientInfo.ip;
      admin.lastLoginDevice = clientInfo.deviceFingerprint;
      await admin.save();

      // حفظ جلسة الأدمن
      await this.saveSession(admin._id, clientInfo, 'admin');

      logger.success(`دخول الأدمن ناجح: ${admin.name}`, { 
        userId: admin._id, 
        ip: clientInfo.ip 
      });

      return {
        success: true,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions || []
        }
      };

    } catch (error) {
      logger.error('فشل في دخول الأدمن', error);
      throw error;
    }
  }

  /**
   * تسجيل دخول العميل
   */
  async clientLogin(name, password, clientInfo) {
    try {
      logger.info(`محاولة دخول العميل: ${name}`, { ip: clientInfo.ip });

      if (!name || !password) {
        throw new Error('يرجى إدخال الاسم وكلمة المرور');
      }

      // البحث عن العميل
      let client = await User.findOne({ 
        name: name.trim(),
        role: 'buyer'
      });

      // إذا لم يكن العميل موجوداً، قم بإنشائه
      if (!client) {
        client = await this.createClient(name, password, clientInfo);
      } else {
        // التحقق من كلمة المرور للعميل الموجود
        const isPasswordValid = await this.verifyPassword(password, client.password);
        if (!isPasswordValid) {
          logger.security('محاولة دخول عميل بكلمة مرور خاطئة', client._id, clientInfo.ip);
          throw new Error('كلمة المرور غير صحيحة');
        }

        // تحديث معلومات الجهاز
        if (client.deviceFingerprint !== clientInfo.deviceFingerprint) {
          client.deviceFingerprint = clientInfo.deviceFingerprint;
          await client.save();
        }
      }

      // التحقق من حالة الحساب
      if (client.status === 'suspended') {
        logger.security('محاولة دخول بحساب معلق', client._id, clientInfo.ip);
        throw new Error('حسابك معلق. يرجى التواصل مع الإدارة');
      }

      // تحديث معلومات العميل
      client.lastLogin = new Date();
      client.lastLoginIP = clientInfo.ip;
      client.lastLoginDevice = clientInfo.deviceFingerprint;
      client.loginCount = (client.loginCount || 0) + 1;
      await client.save();

      // حفظ جلسة العميل
      await this.saveSession(client._id, clientInfo, 'client');

      logger.success(`دخول العميل ناجح: ${client.name}`, { 
        userId: client._id, 
        ip: clientInfo.ip 
      });

      return {
        success: true,
        user: {
          id: client._id,
          name: client.name,
          email: client.email,
          role: client.role,
          permissions: client.permissions || {}
        }
      };

    } catch (error) {
      logger.error('فشل في دخول العميل', error);
      throw error;
    }
  }

  /**
   * إنشاء عميل جديد
   */
  async createClient(name, password, clientInfo) {
    try {
      logger.info(`إنشاء عميل جديد: ${name}`, { ip: clientInfo.ip });

      // التحقق من أن الجهاز غير مرتبط بحسابات كثيرة
      const deviceClients = await User.countDocuments({ 
        deviceFingerprint: clientInfo.deviceFingerprint,
        role: 'buyer'
      });

      if (deviceClients >= 5) {
        logger.security('محاولة إنشاء حساب جديد يتجاوز الحد المسموح', null, clientInfo.ip);
        throw new Error('هذا الجهاز مرتبط بالحد الأقصى من الحسابات. يرجى التواصل مع الإدارة');
      }

      // إنشاء حساب جديد
      const hashedPassword = await this.hashPassword(password);
      const client = new User({
        name: name.trim(),
        email: `client_${Date.now()}@hmcar.local`,
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

      logger.success(`تم إنشاء عميل جديد: ${name}`, { 
        userId: client._id, 
        ip: clientInfo.ip 
      });

      return client;

    } catch (error) {
      logger.error('فشل في إنشاء العميل', error);
      throw error;
    }
  }

  /**
   * حفظ جلسة المستخدم
   */
  async saveSession(userId, clientInfo, userType) {
    try {
      const session = new ClientSession({
        userId: userId,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: clientInfo.deviceFingerprint,
        platform: clientInfo.platform,
        browser: clientInfo.browser,
        loginTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        userType: userType
      });
      
      await session.save();
      logger.database('insert', 'ClientSession', true);
      
      return session;
    } catch (error) {
      logger.error('فشل في حفظ الجلسة', error);
      return null;
    }
  }

  /**
   * إنهاء جلسة المستخدم
   */
  async terminateSession(sessionId, terminatedBy = null) {
    try {
      await ClientSession.findByIdAndUpdate(sessionId, {
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: terminatedBy
      });

      logger.info(`تم إنهاء الجلسة: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error('فشل في إنهاء الجلسة', error);
      return false;
    }
  }

  /**
   * الحصول على الجلسات النشطة للمستخدم
   */
  async getActiveSessions(userId) {
    try {
      return await ClientSession.find({
        userId: userId,
        isActive: true
      }).sort({ lastActivity: -1 });
    } catch (error) {
      logger.error('فشل في الحصول على الجلسات النشطة', error);
      return [];
    }
  }

  /**
   * التحقق من وجود جلسة نشطة للجهاز
   */
  async hasActiveSession(deviceFingerprint) {
    try {
      const session = await ClientSession.findOne({
        deviceFingerprint: deviceFingerprint,
        isActive: true
      });
      return !!session;
    } catch (error) {
      logger.error('فشل في التحقق من الجلسة النشطة', error);
      return false;
    }
  }

  /**
   * تنظيف الجلسات القديمة
   */
  async cleanupOldSessions(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      const result = await ClientSession.deleteMany({
        $or: [
          { lastActivity: { $lt: cutoffDate } },
          { isActive: false, logoutTime: { $lt: cutoffDate } }
        ]
      });

      logger.info(`تم تنظيف ${result.deletedCount} جلسة قديمة`);
      return result.deletedCount;
    } catch (error) {
      logger.error('فشل في تنظيف الجلسات القديمة', error);
      return 0;
    }
  }
}

// إنشاء نسخة واحدة من خدمة المصادقة
const authService = new AuthService();

module.exports = authService;
