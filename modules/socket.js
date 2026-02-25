// [[ARABIC_HEADER]] هذا الملف (modules/socket.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * @file modules/socket.js
 * @description وحدة التحكم في الاتصالات الفورية (WebSockets).
 * تتيح هذه الوحدة إرسال التنبيهات الفورية وتحديثات المزادات بين الخادم والمتصفح.
 */

const { Server } = require('socket.io');
const logger = require('./core/logger');

/**
 * فئة إدارة السوكيت (SocketModule)
 */
class SocketModule {
    constructor() {
        this.io = null;
    }

    /**
     * تهيئة محرك Socket.io وربطه بخادم HTTP
     * @param {Object} server - خادم HTTP الذي سيعمل عليه السوكيت
     */
    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*", // في بيئة الإنتاج يفضل تحديد النطاقات بدقة
                methods: ["GET", "POST"]
            }
        });

        // معالجة اتصال بروتوكول Socket
        this.io.on('connection', (socket) => {
            const socketId = socket.id;
            logger.info(`🔌 مستخدم جديد متصل: ${socketId}`);

            // حدث الانضمام إلى غرفة (Room) محددة
            socket.on('join_room', (room) => {
                socket.join(room);
                logger.info(`👥 السوكيت ${socketId} انضم إلى الغرفة: ${room}`);
            });

            // حدث تسجيل دخول المستخدم - يتم إبلاغ لوحة تحكم الإدارة فوراً
            socket.on('user_login', (userData) => {
                logger.info(`🔑 دخول المستخدم: ${userData.name}`);
                this.io.to('admin_room').emit('admin_notification', {
                    type: 'USER_LOGIN',
                    title: 'تنبيه دخول',
                    message: `العميل ${userData.name} دخل المنصة حالياً.`,
                    data: userData,
                    timestamp: new Date()
                });
            });

            // تتبع مسار تصفح العميل (Real-time Tracking) لإظهاره للأدمن
            socket.on('user_navigation', (data) => {
                this.io.to('admin_room').emit('admin_notification', {
                    type: 'USER_NAV',
                    title: 'نشاط تصفح',
                    message: `العميل ${data.userName} يشاهد الآن: ${data.page}`,
                    data: data,
                    timestamp: new Date()
                });
            });

            // معالجة قطع الاتصال
            socket.on('disconnect', () => {
                logger.info(`🔌 قطع اتصال المستخدم: ${socketId}`);
            });
        });

        logger.info('✅ تم تفعيل خدمة التحديثات الفورية (Socket.io)');
        return this.io;
    }

    /**
     * إرسال بيانات (Emit) إلى غرفة معينة بشكل مباشر
     */
    emitToRoom(room, event, data) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }

    /**
     * إرسال بيانات (Broadcast) لجميع المستخدمين المتصلين حالياً
     */
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

// تصدير نسخة واحدة من الوحدة (Singleton)
module.exports = new SocketModule();
