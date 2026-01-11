const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { requireAuthAPI } = require('../middleware/auth');

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

module.exports = router;
