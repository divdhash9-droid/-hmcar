/**
 * [[وحدة المقابس - Sockets Module]]
 * 
 * تدير هذه الوحدة التفاعل في الوقت الحقيقي (Real-time) بين الخادم والعملاء.
 * 
 * @author HM CAR Team
 */

const { Server } = require('socket.io');
const logger = require('./core/logger');

class SocketModule {
    constructor() {
        this.io = null;
    }

    /**
     * تهيئة Socket.io
     * @param {Object} server - خادم HTTP
     */
    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*", // في الإنتاج يجب تحديد النطاقات المسموحة
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            const socketId = socket.id;
            logger.info(`🔌 مستخدم متصل: ${socketId}`);

            // الانضمام لغرفة معينة (مثل غرف الأدمن أو غرف المشترين)
            socket.on('join_room', (room) => {
                socket.join(room);
                logger.info(`👥 Socket ${socketId} انضم إلى الغرفة: ${room}`);
            });

            // حدث تسجيل الدخول - يرسل للأدمن
            socket.on('user_login', (userData) => {
                logger.info(`🔑 مستخدم سجل دخوله: ${userData.name}`);
                this.io.to('admin_room').emit('admin_notification', {
                    type: 'USER_LOGIN',
                    title: 'دخول عميل جديد',
                    message: `دخل العميل ${userData.name} إلى المنصة الآن.`,
                    data: userData,
                    timestamp: new Date()
                });
            });

            // حدث تصفح الصفحة - يرسل للأدمن
            socket.on('user_navigation', (data) => {
                this.io.to('admin_room').emit('admin_notification', {
                    type: 'USER_NAV',
                    title: 'تصفح العميل',
                    message: `العميل ${data.userName} يتصفح ${data.page}`,
                    data: data,
                    timestamp: new Date()
                });
            });

            socket.on('disconnect', () => {
                logger.info(`🔌 مستخدم قطع الاتصال: ${socketId}`);
            });
        });

        logger.info('✅ تم تهيئة وحدة Socket.io بنجاح');
        return this.io;
    }

    /**
     * إرسال حدث لغرفة معينة
     */
    emitToRoom(room, event, data) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }

    /**
     * إرسال حدث للجميع
     */
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

module.exports = new SocketModule();
