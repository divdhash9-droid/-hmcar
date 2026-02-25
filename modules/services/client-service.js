// [[ARABIC_HEADER]] هذا الملف (modules/services/client-service.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * [[ملف خدمة العملاء]] - modules/services/client-service.js
 * 
 * هذا الملف يحتوي على جميع خدمات إدارة العملاء
 * - إدارة صلاحيات العملاء
 * - إدارة جلسات العملاء
 * - إدارة حسابات العملاء
 * 
 * @author HM CAR Team
 */

const User = require('../../models/User');
const ClientSession = require('../../models/ClientSession');
const logger = require('../core/logger');

/**
 * فئة خدمة العملاء
 */
class ClientService {
  constructor() {
    this.defaultPermissions = {
      canViewCars: true,
      canViewAuctions: true,
      canViewProfile: true,
      canPlaceBids: true,
      canEditProfile: true,
      canContactAdmin: true,
      canUploadFiles: false,
      canCreateAuctions: false,
      canViewReports: false
    };
  }

  /**
   * الحصول على جميع العملاء
   */
  async getAllClients(filters = {}) {
    try {
      const query = { role: 'buyer' };

      // تطبيق الفلاتر
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
      }

      const clients = await User.find(query)
        .sort({ createdAt: -1 })
        .select('name email status lastLogin lastLoginIP deviceFingerprint deviceLockEnabled deviceAccountLimit permissions loginCount createdAt')
        .lean();

      logger.info(`تم جلب ${clients.length} عميل`);
      return clients;
    } catch (error) {
      logger.error('فشل في جلب العملاء', error);
      throw error;
    }
  }

  /**
   * الحصول على تفاصيل العميل
   */
  async getClientById(clientId) {
    try {
      const client = await User.findById(clientId)
        .populate('sessions');

      if (!client) {
        throw new Error('العميل غير موجود');
      }

      // الحصول على جلسات العميل
      const sessions = await ClientSession.find({ userId: client._id })
        .sort({ lastActivity: -1 })
        .limit(10);

      return {
        ...client.toObject(),
        sessions
      };
    } catch (error) {
      logger.error('فشل في جلب تفاصيل العميل', error);
      throw error;
    }
  }

  /**
   * تحديث صلاحيات العميل
   */
  async updateClientPermissions(clientId, permissions, deviceSettings = {}) {
    try {
      const client = await User.findById(clientId);
      
      if (!client) {
        throw new Error('العميل غير موجود');
      }

      // تحديث الصلاحيات
      if (permissions) {
        client.permissions = {
          ...client.permissions,
          ...permissions
        };
      }

      // تحديث إعدادات الجهاز
      if (deviceSettings.deviceLockEnabled !== undefined) {
        client.deviceLockEnabled = deviceSettings.deviceLockEnabled;
      }

      if (deviceSettings.deviceAccountLimit) {
        client.deviceAccountLimit = deviceSettings.deviceAccountLimit;
      }

      await client.save();

      logger.success(`تم تحديث صلاحيات العميل: ${client.name}`, {
        clientId,
        permissions,
        deviceSettings
      });

      return client;
    } catch (error) {
      logger.error('فشل في تحديث صلاحيات العميل', error);
      throw error;
    }
  }

  /**
   * تحديث الصلاحيات العامة لجميع العملاء
   */
  async updateGlobalPermissions(permission, value) {
    try {
      const result = await User.updateMany(
        { role: 'buyer', status: 'active' },
        { [`permissions.${permission}`]: value }
      );

      logger.success(`تم تحديث الصلاحية العامة: ${permission} = ${value}`, {
        updatedCount: result.modifiedCount
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error('فشل في تحديث الصلاحيات العامة', error);
      throw error;
    }
  }

  /**
   * تعليق العميل
   */
  async suspendClient(clientId, reason = '') {
    try {
      const client = await User.findById(clientId);
      
      if (!client) {
        throw new Error('العميل غير موجود');
      }

      client.status = 'suspended';
      await client.save();

      // إنهاء جميع الجلسات النشطة
      await this.terminateAllClientSessions(clientId);

      logger.warn(`تم تعليق العميل: ${client.name}`, {
        clientId,
        reason
      });

      return client;
    } catch (error) {
      logger.error('فشل في تعليق العميل', error);
      throw error;
    }
  }

  /**
   * تفعيل العميل
   */
  async activateClient(clientId) {
    try {
      const client = await User.findById(clientId);
      
      if (!client) {
        throw new Error('العميل غير موجود');
      }

      client.status = 'active';
      await client.save();

      logger.success(`تم تفعيل العميل: ${client.name}`, {
        clientId
      });

      return client;
    } catch (error) {
      logger.error('فشل في تفعيل العميل', error);
      throw error;
    }
  }

  /**
   * إنهاء جميع جلسات العميل
   */
  async terminateAllClientSessions(clientId) {
    try {
      const result = await ClientSession.updateMany(
        { userId: clientId, isActive: true },
        { isActive: false, terminatedAt: new Date() }
      );

      logger.info(`تم إنهاء ${result.modifiedCount} جلسة للعميل`, {
        clientId
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error('فشل في إنهاء جلسات العميل', error);
      throw error;
    }
  }

  /**
   * إنهاء جلسة محددة
   */
  async terminateSession(sessionId, terminatedBy = null) {
    try {
      const session = await ClientSession.findByIdAndUpdate(
        sessionId,
        {
          isActive: false,
          terminatedAt: new Date(),
          terminatedBy: terminatedBy
        },
        { new: true }
      );

      if (!session) {
        throw new Error('الجلسة غير موجودة');
      }

      logger.info(`تم إنهاء الجلسة: ${sessionId}`, {
        userId: session.userId,
        terminatedBy
      });

      return session;
    } catch (error) {
      logger.error('فشل في إنهاء الجلسة', error);
      throw error;
    }
  }

  /**
   * إعادة تعيين جهاز العميل
   */
  async resetClientDevice(clientId) {
    try {
      const client = await User.findById(clientId);
      
      if (!client) {
        throw new Error('العميل غير موجود');
      }

      // إنهاء جميع الجلسات النشطة
      await this.terminateAllClientSessions(clientId);

      // إعادة تعيين بصمة الجهاز
      client.deviceFingerprint = null;
      client.deviceLockEnabled = false;
      await client.save();

      logger.success(`تم إعادة تعيين جهاز العميل: ${client.name}`, {
        clientId
      });

      return client;
    } catch (error) {
      logger.error('فشل في إعادة تعيين جهاز العميل', error);
      throw error;
    }
  }

  /**
   * الحصول على جميع الجلسات النشطة
   */
  async getAllActiveSessions() {
    try {
      const sessions = await ClientSession.find({ isActive: true })
        .populate('userId', 'name email role status')
        .sort({ lastActivity: -1 })
        .limit(100);

      logger.info(`تم جلب ${sessions.length} جلسة نشطة`);
      return sessions;
    } catch (error) {
      logger.error('فشل في جلب الجلسات النشطة', error);
      throw error;
    }
  }

  /**
   * تنفيذ إجراء جماعي على العملاء
   */
  async bulkAction(action, clientIds, options = {}) {
    try {
      if (!clientIds || !Array.isArray(clientIds)) {
        throw new Error('يجب تحديد العملاء');
      }

      let updateData = {};
      let message = '';

      switch (action) {
        case 'suspend':
          updateData = { status: 'suspended' };
          message = 'تعليق';
          break;
        case 'activate':
          updateData = { status: 'active' };
          message = 'تفعيل';
          break;
        case 'update_permissions':
          if (options.permissions) {
            Object.keys(options.permissions).forEach(key => {
              updateData[`permissions.${key}`] = options.permissions[key];
            });
          }
          message = 'تحديث الصلاحيات';
          break;
        case 'reset_devices':
          updateData = { deviceFingerprint: null, deviceLockEnabled: false };
          message = 'إعادة تعيين الأجهزة';
          break;
        default:
          throw new Error('إجراء غير صالح');
      }

      const result = await User.updateMany(
        { _id: { $in: clientIds }, role: 'buyer' },
        updateData
      );

      logger.success(`تم ${message} ${result.modifiedCount} عميل`, {
        action,
        clientIds,
        updatedCount: result.modifiedCount
      });

      return {
        success: true,
        updatedCount: result.modifiedCount,
        message: `تم ${message} ${result.modifiedCount} عميل`
      };
    } catch (error) {
      logger.error('فشل في تنفيذ الإجراء الجماعي', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات العملاء
   */
  async getClientStats() {
    try {
      const stats = await Promise.all([
        User.countDocuments({ role: 'buyer' }),
        User.countDocuments({ role: 'buyer', status: 'active' }),
        User.countDocuments({ role: 'buyer', status: 'suspended' }),
        ClientSession.countDocuments({ isActive: true }),
        User.countDocuments({ 
          role: 'buyer', 
          lastLogin: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          } 
        })
      ]);

      return {
        total: stats[0],
        active: stats[1],
        suspended: stats[2],
        activeSessions: stats[3],
        last24Hours: stats[4]
      };
    } catch (error) {
      logger.error('فشل في جلب إحصائيات العملاء', error);
      throw error;
    }
  }

  /**
   * البحث عن العملاء
   */
  async searchClients(query, filters = {}) {
    try {
      const searchRegex = new RegExp(query, 'i');
      const searchQuery = {
        role: 'buyer',
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      };

      // تطبيق الفلاتر الإضافية
      if (filters.status) {
        searchQuery.status = filters.status;
      }

      const clients = await User.find(searchQuery)
        .sort({ lastLogin: -1 })
        .limit(20)
        .select('name email status lastLogin deviceFingerprint')
        .lean();

      return clients;
    } catch (error) {
      logger.error('فشل في البحث عن العملاء', error);
      throw error;
    }
  }
}

// إنشاء نسخة واحدة من خدمة العملاء
const clientService = new ClientService();

module.exports = clientService;
