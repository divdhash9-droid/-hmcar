// [[ARABIC_HEADER]] هذا الملف (services/WebSocketService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/WebSocketService.js
 * خدمة WebSocket للاتصال الفوري (Realtime)
 * 
 * الوصف:
 * - توفر اتصال ثنائي الاتجاه بين السيرفر والعميل
 * - تُستخدم للمزادات المباشرة والإشعارات الفورية
 * - تدعم المصادقة عبر JWT
 * 
 * الأحداث:
 * - bid:new - مزايدة جديدة
 * - notification:new - إشعار جديد
 * - auction:update - تحديث مزاد
 */
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    WebSocketService.instance = this;
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:4000",
        methods: ["GET", "POST"]
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication token required'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return next(new Error('User not found'));

        socket.user = user;
        next();
      } catch (error) {
        return next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket service initialized');
  }

  handleConnection(socket) {
    console.log(`User ${socket.user.name} connected (${socket.id})`);
    this.connectedUsers.set(socket.user._id.toString(), socket.id);

    socket.join(`user_${socket.user._id}`);
    if (socket.user.role === 'admin' || socket.user.role === 'super_admin') {
      socket.join('admin_room');
    }

    socket.on('join_room', (room) => socket.join(room));
    socket.on('leave_room', (room) => socket.leave(room));

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      this.connectedUsers.delete(socket.user._id.toString());
    });
    
    // Example of a more generic event
    socket.on('client_event', (data) => {
        // Process generic client events if needed
        console.log(`Received event '${data.type}' from ${socket.user.name}`);
    });
  }

  /**
   * Emits an event to a specific room.
   * @param {string} room - The room to emit to.
   * @param {string} event - The event name.
   * @param {object} data - The data to send.
   */
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  /**
   * Sends a notification to a single user.
   * @param {string} userId - The user's ID.
   * @param {object} notification - The notification object.
   */
  sendToUser(userId, notification) {
    this.emitToRoom(`user_${userId}`, 'notification', notification);
  }

  /**
   * Sends a notification to multiple users.
   * @param {string[]} userIds - An array of user IDs.
   * @param {object} notification - The notification object.
   */
  sendToUsers(userIds, notification) {
      if(!this.io) return;
      userIds.forEach(userId => {
          const socketId = this.connectedUsers.get(userId.toString());
          if(socketId){
              this.io.to(socketId).emit('notification', notification);
          }
      });
  }

  /**
   * Broadcasts an event to all connected clients except the sender.
   * @param {object} socket - The sender's socket object.
   * @param {string} event - The event name.
   * @param {object} data - The data to send.
   */
  broadcast(socket, event, data) {
    socket.broadcast.emit(event, data);
  }
  
  /**
   * Broadcasts an event to all connected clients.
   * @param {string} event - The event name.
   * @param {object} data - The data to send.
   */
  broadcastAll(event, data) {
      if(this.io){
          this.io.emit(event, data);
      }
  }

  /**
   * Sends a notification to all admins.
   * @param {object} notification - The notification object.
   */
  sendToAdmins(notification) {
    this.emitToRoom('admin_room', 'notification', notification);
  }

  /**
   * Sends an update about an auction.
   * @param {string} auctionId - The auction's ID.
   * @param {string} event - The event name (e.g., 'bid_update', 'timer_update').
   * @param {object} data - The data to send.
   */
  sendAuctionUpdate(auctionId, event, data) {
    this.emitToRoom(`auction_${auctionId}`, event, data);
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get online users list (for admin monitoring)
   */
  getOnlineUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, socketId]) => ({
      userId,
      socketId,
      connectedAt: new Date() // يمكن تحسينها بحفظ وقت الاتصال
    }));
  }

  /**
   * Disconnect user forcefully (admin action)
   */
  disconnectUser(userId) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId && this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        return true;
      }
    }
    return false;
  }

  /**
   * Send typing indicator for chat
   */
  sendTyping(roomId, userId, isTyping) {
    this.emitToRoom(roomId, 'user_typing', { userId, isTyping });
  }

  /**
   * Get room size (number of connected clients)
   */
  getRoomSize(roomName) {
    if (!this.io) return 0;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }
}

module.exports = new WebSocketService();
