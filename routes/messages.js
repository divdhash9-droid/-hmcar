// [[ARABIC_HEADER]] هذا الملف (routes/messages.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { requireAuth, requireAuthAPI } = require('../middleware/auth');

// Messages UI page
router.get('/', requireAuth, async (req, res) => {
  res.render('messages/index', {
    title: 'الرسائل',
    currentUserId: req.session.user?._id ? String(req.session.user._id) : ''
  });
});

// Get all conversations for current user
router.get('/conversations', requireAuthAPI, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name phone')
    .populate('lastMessage')
    .populate('relatedTo')
    .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages in a conversation
router.get('/conversation/:id', requireAuthAPI, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول لهذه المحادثة' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: conversation.participants.find(p => !p.equals(req.user._id)) },
        { receiver: req.user._id, sender: conversation.participants.find(p => !p.equals(req.user._id)) }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/send', requireAuthAPI, async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', relatedTo, relatedToModel } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'المستلم والمحتوى مطلوبان' });
    }

    // Create or find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
      relatedTo: relatedTo || null,
      isActive: true
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, receiverId],
        relatedTo,
        relatedToModel
      });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      messageType,
      relatedTo,
      relatedToModel
    });

    await message.save();
    
    // Update conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate message details
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    // Emit real-time message via socket.io
    req.app.get('io').to(`user_${receiverId}`).emit('newMessage', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread messages count
router.get('/unread-count', requireAuthAPI, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark conversation as archived
router.post('/conversation/:id/archive', requireAuthAPI, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول لهذه المحادثة' });
    }

    conversation.archivedBy.push({
      user: req.user._id,
      archivedAt: new Date()
    });

    await conversation.save();
    res.json({ message: 'تم أرشفة المحادثة' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// عرض صفحة الرسائل
router.get('/page', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    // جلب المحادثات مع تفاصيل المستخدمين الآخرين
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name email avatar')
    .populate('lastMessage')
    .populate('relatedTo')
    .sort({ updatedAt: -1 });

    // تنسيق البيانات للعرض
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(p => !p._id.equals(userId));
      return {
        _id: conv._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar
        },
        lastMessage: conv.lastMessage,
        messageCount: conv.messageCount || 0,
        unreadCount: conv.unreadCount || 0,
        relatedTo: conv.relatedTo
      };
    });

    res.render('client/messages', { 
      conversations: formattedConversations,
      user: req.session.user,
      title: 'الرسائل - HM CAR'
    });
  } catch (error) {
    console.error('Error fetching messages page:', error);
    res.status(500).render('errors/500', { error: 'حدث خطأ أثناء تحميل صفحة الرسائل' });
  }
});

// جلب قائمة المحادثات (API)
router.get('/', requireAuthAPI, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name email avatar')
    .populate('lastMessage')
    .populate('relatedTo')
    .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(p => !p._id.equals(userId));
      return {
        _id: conv._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar
        },
        lastMessage: conv.lastMessage,
        messageCount: conv.messageCount || 0,
        unreadCount: conv.unreadCount || 0,
        relatedTo: conv.relatedTo
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'فشل في جلب المحادثات' });
  }
});

// جلب رسائل محادثة محددة
router.get('/:id', requireAuthAPI, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول لهذه المحادثة' });
    }

    const messages = await Message.find({
      conversation: req.params.id
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: req.params.id,
        receiver: req.user._id,
        read: false 
      },
      { read: true, readAt: new Date() }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'فشل في جلب الرسائل' });
  }
});

// إرسال رسالة جديدة
router.post('/', requireAuthAPI, async (req, res) => {
  try {
    const { recipient, content, relatedTo } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ error: 'المستلم والمحتوى مطلوبان' });
    }

    // Create or find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipient] },
      isActive: true
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipient],
        relatedTo
      });
      await conversation.save();
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: recipient,
      content,
      conversation: conversation._id,
      relatedTo
    });

    await message.save();
    
    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate message details
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Emit real-time message via socket.io
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${recipient}`).emit('newMessage', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'فشل في إرسال الرسالة' });
  }
});

// حذف محادثة
router.delete('/:id', requireAuthAPI, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول لهذه المحادثة' });
    }

    conversation.isActive = false;
    await conversation.save();

    res.json({ message: 'تم حذف المحادثة' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'فشل في حذف المحادثة' });
  }
});

module.exports = router;
