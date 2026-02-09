// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/messages.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Message = require('../../../models/Message');
const User = require('../../../models/User');
const { requireAuthAPI } = require('../../../middleware/auth');

// الحصول على جميع المحادثات
router.get('/conversations', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // جلب آخر رسالة من كل محادثة
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // جلب معلومات المستخدمين
        const userIds = messages.map(m => m._id);
        const users = await User.find({ _id: { $in: userIds } }).select('name email');
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        res.json({
            success: true,
            data: messages.map(m => ({
                id: m._id,
                user: userMap[m._id.toString()] || { name: 'مستخدم محذوف' },
                lastMessage: {
                    content: m.lastMessage.content,
                    createdAt: m.lastMessage.createdAt,
                    isFromMe: m.lastMessage.sender.toString() === userId.toString()
                },
                unreadCount: m.unreadCount
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب المحادثات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المحادثات' });
    }
});

// الحصول على رسائل محادثة معينة
router.get('/conversation/:userId', requireAuthAPI, async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // تحديد الرسائل كمقروءة
        await Message.updateMany(
            { sender: userId, receiver: currentUserId, read: false },
            { read: true }
        );

        res.json({
            success: true,
            data: messages.reverse().map(m => ({
                id: m._id,
                content: m.content,
                isFromMe: m.sender.toString() === currentUserId.toString(),
                read: m.read,
                createdAt: m.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب الرسائل:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب الرسائل' });
    }
});

// إرسال رسالة جديدة
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const senderId = req.user._id || req.user.id;
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ success: false, error: 'المستلم والمحتوى مطلوبان' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ success: false, error: 'الرسالة طويلة جداً' });
        }

        // التحقق من وجود المستلم
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, error: 'المستلم غير موجود' });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content: content.trim(),
            read: false
        });

        res.status(201).json({
            success: true,
            message: 'تم إرسال الرسالة',
            data: {
                id: message._id,
                content: message.content,
                createdAt: message.createdAt
            }
        });
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في الإرسال' });
    }
});

// تحديد رسالة كمقروءة
router.patch('/:id/read', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { id } = req.params;

        const message = await Message.findOneAndUpdate(
            { _id: id, receiver: userId },
            { read: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }

        res.json({
            success: true,
            message: 'تم تحديد الرسالة كمقروءة'
        });
    } catch (error) {
        console.error('خطأ في تحديث الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في التحديث' });
    }
});

// حذف رسالة
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { id } = req.params;

        const message = await Message.findOneAndDelete({
            _id: id,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({ success: false, error: 'الرسالة غير موجودة أو لا يمكنك حذفها' });
        }

        res.json({
            success: true,
            message: 'تم حذف الرسالة'
        });
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في الحذف' });
    }
});

// عدد الرسائل غير المقروءة
router.get('/unread-count', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const count = await Message.countDocuments({
            receiver: userId,
            read: false
        });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('خطأ في حساب الرسائل:', error);
        res.status(500).json({ success: false, error: 'فشل في الحساب' });
    }
});

module.exports = router;
